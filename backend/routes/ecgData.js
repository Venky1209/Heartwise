const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Validation schema for bulk ECG data upload
const ecgDataSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
  dataPoints: Joi.array().items(
    Joi.object({
      timestamp: Joi.number().required(),
      voltage: Joi.number().required(),
      qualityScore: Joi.number().min(0).max(1).optional(),
      isArtifact: Joi.boolean().default(false)
    })
  ).min(1).max(10000).required() // Limit to 10k points per request
});

// Get ECG data points for a session
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit) || 50000; // Default to 50k points max
    
    // Verify session exists
    const sessionCheck = await req.app.locals.db.query(
      'SELECT id FROM ecg_sessions WHERE id = $1', [sessionId]
    );
    
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const query = `
      SELECT id, timestamp_ms, voltage_mv, quality_score, is_artifact, created_at
      FROM ecg_data_points
      WHERE session_id = $1
      ORDER BY timestamp_ms ASC
      LIMIT $2
    `;
    
    const result = await req.app.locals.db.query(query, [sessionId, limit]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ECG data:', error);
    res.status(500).json({ error: 'Failed to fetch ECG data' });
  }
});

// Bulk insert ECG data points
router.post('/bulk', async (req, res) => {
  try {
    const { error, value } = ecgDataSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message)
      });
    }

    const { sessionId, dataPoints } = value;

    // Verify session exists
    const sessionCheck = await req.app.locals.db.query(
      'SELECT id FROM ecg_sessions WHERE id = $1', [sessionId]
    );
    
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Prepare bulk insert
    const client = await req.app.locals.db.connect();
    
    try {
      await client.query('BEGIN');
      
      const insertPromises = dataPoints.map(point => {
        return client.query(
          `INSERT INTO ecg_data_points (session_id, timestamp_ms, voltage_mv, quality_score, is_artifact)
           VALUES ($1, $2, $3, $4, $5)`,
          [sessionId, point.timestamp, point.voltage, point.qualityScore, point.isArtifact]
        );
      });

      await Promise.all(insertPromises);
      await client.query('COMMIT');
      
      res.status(201).json({
        message: 'ECG data inserted successfully',
        sessionId,
        pointsInserted: dataPoints.length
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error inserting ECG data:', error);
    res.status(500).json({ error: 'Failed to insert ECG data' });
  }
});

// Get ECG data statistics for a session
router.get('/stats/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const query = `
      SELECT 
        COUNT(*) as total_points,
        MIN(voltage_mv) as min_voltage,
        MAX(voltage_mv) as max_voltage,
        AVG(voltage_mv) as avg_voltage,
        STDDEV(voltage_mv) as voltage_stddev,
        COUNT(CASE WHEN is_artifact = true THEN 1 END) as artifact_count,
        AVG(quality_score) as avg_quality,
        MIN(timestamp_ms) as start_timestamp,
        MAX(timestamp_ms) as end_timestamp,
        (MAX(timestamp_ms) - MIN(timestamp_ms)) as duration_ms
      FROM ecg_data_points
      WHERE session_id = $1
    `;
    
    const result = await req.app.locals.db.query(query, [sessionId]);
    
    if (result.rows[0].total_points === '0') {
      return res.status(404).json({ error: 'No ECG data found for this session' });
    }
    
    const stats = result.rows[0];
    
    // Calculate sample rate
    if (stats.duration_ms > 0 && stats.total_points > 1) {
      stats.calculated_sample_rate = (stats.total_points / (stats.duration_ms / 1000)).toFixed(2);
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching ECG data statistics:', error);
    res.status(500).json({ error: 'Failed to fetch ECG data statistics' });
  }
});

// Export ECG data as CSV
router.get('/export/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const format = req.query.format || 'csv';
    
    if (format !== 'csv') {
      return res.status(400).json({ error: 'Only CSV format is currently supported' });
    }

    // Get session info
    const sessionQuery = `
      SELECT es.*, p.first_name, p.last_name
      FROM ecg_sessions es
      JOIN patients p ON es.patient_id = p.id
      WHERE es.id = $1
    `;
    const sessionResult = await req.app.locals.db.query(sessionQuery, [sessionId]);
    
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const session = sessionResult.rows[0];

    // Get ECG data
    const dataQuery = `
      SELECT timestamp_ms, voltage_mv, quality_score, is_artifact, created_at
      FROM ecg_data_points
      WHERE session_id = $1
      ORDER BY timestamp_ms ASC
    `;
    const dataResult = await req.app.locals.db.query(dataQuery, [sessionId]);

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 
      `attachment; filename="ecg_data_${session.first_name}_${session.last_name}_${sessionId.substring(0, 8)}.csv"`);

    // Write CSV header
    res.write('timestamp_ms,voltage_mv,quality_score,is_artifact,recorded_at\n');

    // Write data rows
    dataResult.rows.forEach(row => {
      res.write(`${row.timestamp_ms},${row.voltage_mv},${row.quality_score || ''},${row.is_artifact},${row.created_at.toISOString()}\n`);
    });

    res.end();
  } catch (error) {
    console.error('Error exporting ECG data:', error);
    res.status(500).json({ error: 'Failed to export ECG data' });
  }
});

// Get ECG data for analysis (filtered, high quality)
router.get('/analysis/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const minQuality = parseFloat(req.query.minQuality) || 0.7;
    
    const query = `
      SELECT timestamp_ms, voltage_mv, quality_score
      FROM ecg_data_points
      WHERE session_id = $1 
        AND is_artifact = false
        AND (quality_score IS NULL OR quality_score >= $2)
      ORDER BY timestamp_ms ASC
    `;
    
    const result = await req.app.locals.db.query(query, [sessionId, minQuality]);
    
    // Format data for AI/ML analysis
    const analysisData = {
      sessionId,
      sampleRate: null, // Will be calculated
      signals: result.rows.map(row => ({
        time: row.timestamp_ms / 1000, // Convert to seconds
        amplitude: row.voltage_mv,
        quality: row.quality_score
      })),
      metadata: {
        totalPoints: result.rows.length,
        qualityThreshold: minQuality,
        extractedAt: new Date().toISOString()
      }
    };

    // Calculate sample rate if we have enough data
    if (result.rows.length > 1) {
      const duration = (result.rows[result.rows.length - 1].timestamp_ms - result.rows[0].timestamp_ms) / 1000;
      analysisData.sampleRate = result.rows.length / duration;
    }
    
    res.json(analysisData);
  } catch (error) {
    console.error('Error fetching ECG data for analysis:', error);
    res.status(500).json({ error: 'Failed to fetch ECG data for analysis' });
  }
});

// Mark data points as artifacts (for data cleaning)
router.post('/mark-artifacts', async (req, res) => {
  try {
    const { sessionId, startTime, endTime, reason } = req.body;
    
    if (!sessionId || !startTime || !endTime) {
      return res.status(400).json({ error: 'sessionId, startTime, and endTime are required' });
    }

    const query = `
      UPDATE ecg_data_points 
      SET is_artifact = true
      WHERE session_id = $1 
        AND timestamp_ms >= $2 
        AND timestamp_ms <= $3
    `;
    
    const result = await req.app.locals.db.query(query, [sessionId, startTime, endTime]);
    
    res.json({
      message: 'Data points marked as artifacts',
      affectedRows: result.rowCount,
      reason: reason || 'Manual marking'
    });
  } catch (error) {
    console.error('Error marking artifacts:', error);
    res.status(500).json({ error: 'Failed to mark artifacts' });
  }
});

module.exports = router;