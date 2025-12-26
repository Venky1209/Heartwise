const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { authenticateToken } = require('./auth');

// Validation schemas
const sessionSchema = Joi.object({
  sessionName: Joi.string().max(200).optional(),
  sampleRate: Joi.number().integer().min(100).max(1000).default(250),
  deviceId: Joi.string().max(100).optional(),
  notes: Joi.string().allow('').optional()
});

// Get all sessions for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT es.*, 
        up.first_name, up.last_name,
        COUNT(edp.id) as data_points_count,
        COALESCE(AVG(edp.voltage_mv), 0) as avg_voltage
      FROM ecg_sessions es
      INNER JOIN user_profiles up ON es.user_id = up.user_id
      LEFT JOIN ecg_data_points edp ON es.id = edp.session_id
      WHERE es.user_id = $1
      GROUP BY es.id, up.first_name, up.last_name
      ORDER BY es.start_time DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await req.app.locals.db.query(query, [userId, limit, offset]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get session by ID for authenticated user
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const query = `
      SELECT es.*, 
        up.first_name, up.last_name, up.date_of_birth, up.gender,
        COUNT(edp.id) as data_points_count,
        MIN(edp.voltage_mv) as min_voltage,
        MAX(edp.voltage_mv) as max_voltage,
        AVG(edp.voltage_mv) as avg_voltage,
        d.device_name, d.firmware_version
      FROM ecg_sessions es
      INNER JOIN user_profiles up ON es.user_id = up.user_id
      LEFT JOIN ecg_data_points edp ON es.id = edp.session_id
      LEFT JOIN devices d ON es.device_id = d.device_id
      WHERE es.id = $1 AND es.user_id = $2
      GROUP BY es.id, up.id, d.id
    `;
    
    const result = await req.app.locals.db.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get analysis results for this session
    const analysisQuery = `
      SELECT * FROM ecg_analysis_results 
      WHERE session_id = $1 
      ORDER BY processed_at DESC
    `;
    const analysisResult = await req.app.locals.db.query(analysisQuery, [id]);
    
    const session = result.rows[0];
    session.analysis_results = analysisResult.rows;
    
    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Create new session for authenticated user
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Session creation request body:', JSON.stringify(req.body, null, 2));
    
    const { error, value } = sessionSchema.validate(req.body);
    
    if (error) {
      console.error('❌ Validation error:', error.details);
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message)
      });
    }
    
    console.log('✓ Validation passed, creating session with:', value);

    const userId = req.user.userId;
    const { sessionName, sampleRate, deviceId, notes } = value;

    const query = `
      INSERT INTO ecg_sessions (user_id, session_name, sample_rate, device_id, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await req.app.locals.db.query(query, [
      userId, sessionName, sampleRate, deviceId, notes
    ]);
    
    const newSession = result.rows[0];
    
    console.log('📝 New session created:', {
      id: newSession.id,
      deviceId: deviceId,
      userId: userId
    });
    
    // Send start-recording command to ESP32 if device is connected
    if (deviceId) {
      const esp32Connections = req.app.locals.esp32Connections;
      console.log('🔍 Available ESP32 connections:', Array.from(esp32Connections.keys()));
      const esp32Ws = esp32Connections.get(deviceId);
      
      if (esp32Ws && esp32Ws.readyState === 1) { // 1 = OPEN
        const command = {
          event: 'start-recording',  // Arduino expects 'event' not 'type'
          sessionId: newSession.id,
          sampleRate: sampleRate
        };
        console.log('📤 Sending command to ESP32:', command);
        esp32Ws.send(JSON.stringify(command));
        console.log(`📡 Sent start-recording command to device: ${deviceId}`);
      } else {
        console.warn(`⚠️ Device ${deviceId} not connected, cannot start recording`);
        console.warn(`   WebSocket state: ${esp32Ws ? esp32Ws.readyState : 'not found'}`);
      }
    } else {
      console.warn('⚠️ No deviceId specified in session');
    }
    
    res.status(201).json({
      message: 'ECG session created successfully',
      session: newSession
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Update session (typically to mark as completed)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isCompleted, endTime, notes } = req.body;
    
    let setClause = '';
    let queryParams = [id];
    let paramIndex = 2;
    
    if (isCompleted !== undefined) {
      if (setClause) setClause += ', ';
      setClause += `is_completed = $${paramIndex}`;
      queryParams.push(isCompleted);
      paramIndex++;
    }
    
    if (endTime) {
      if (setClause) setClause += ', ';
      setClause += `end_time = $${paramIndex}`;
      queryParams.push(endTime);
      paramIndex++;
      
      // Calculate duration
      if (setClause) setClause += ', ';
      setClause += `duration_seconds = EXTRACT(EPOCH FROM ($${paramIndex-1}::timestamptz - start_time))`;
    }
    
    if (notes !== undefined) {
      if (setClause) setClause += ', ';
      setClause += `notes = $${paramIndex}`;
      queryParams.push(notes);
    }
    
    // If no fields to update, return error
    if (!setClause) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const query = `
      UPDATE ecg_sessions 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await req.app.locals.db.query(query, queryParams);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const updatedSession = result.rows[0];
    
    // Send stop-recording command to ESP32 if session is completed
    if (isCompleted && updatedSession.device_id) {
      const esp32Connections = req.app.locals.esp32Connections;
      const esp32Ws = esp32Connections.get(updatedSession.device_id);
      
      if (esp32Ws && esp32Ws.readyState === 1) { // 1 = OPEN
        esp32Ws.send(JSON.stringify({
          event: 'stop-recording',  // Arduino expects 'event' not 'type'
          sessionId: updatedSession.id
        }));
        console.log(`📡 Sent stop-recording command to device: ${updatedSession.device_id}`);
      }
    }
    
    res.json({
      message: 'Session updated successfully',
      session: updatedSession
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete session
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM ecg_sessions WHERE id = $1 RETURNING id';
    const result = await req.app.locals.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Get ECG data for a session (for visualization)
router.get('/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000; // Default to 1000 data points
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT timestamp_ms, voltage_mv, quality_score, is_artifact
      FROM ecg_data_points
      WHERE session_id = $1
      ORDER BY timestamp_ms ASC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await req.app.locals.db.query(query, [id, limit, offset]);
    
    res.json({
      sessionId: id,
      dataPoints: result.rows,
      page,
      limit,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching session data:', error);
    res.status(500).json({ error: 'Failed to fetch session data' });
  }
});

// Get real-time ECG data (last N seconds)
router.get('/:id/live', async (req, res) => {
  try {
    const { id } = req.params;
    const seconds = parseInt(req.query.seconds) || 30; // Default to last 30 seconds
    
    const query = `
      SELECT timestamp_ms, voltage_mv, created_at
      FROM ecg_data_points
      WHERE session_id = $1 
        AND created_at > NOW() - INTERVAL '${seconds} seconds'
      ORDER BY timestamp_ms ASC
    `;
    
    const result = await req.app.locals.db.query(query, [id]);
    
    res.json({
      sessionId: id,
      dataPoints: result.rows,
      timeRange: `${seconds} seconds`,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching live session data:', error);
    res.status(500).json({ error: 'Failed to fetch live session data' });
  }
});

module.exports = router;