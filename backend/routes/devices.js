const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Validation schema
const deviceSchema = Joi.object({
  deviceId: Joi.string().max(100).required(),
  deviceName: Joi.string().max(200).optional(),
  firmwareVersion: Joi.string().max(50).optional(),
  batteryLevel: Joi.number().integer().min(0).max(100).optional(),
  calibrationData: Joi.object().optional()
});

// Get all devices
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT *, 
        CASE 
          WHEN last_seen > NOW() - INTERVAL '5 minutes' THEN 'online'
          WHEN last_seen > NOW() - INTERVAL '1 hour' THEN 'recent'
          ELSE 'offline'
        END as status
      FROM devices
      ORDER BY last_seen DESC NULLS LAST
    `;
    
    const result = await req.app.locals.db.query(query);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Get device by ID
router.get('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const query = `
      SELECT d.*,
        COUNT(es.id) as total_sessions,
        MAX(es.start_time) as last_session_date,
        CASE 
          WHEN d.last_seen > NOW() - INTERVAL '5 minutes' THEN 'online'
          WHEN d.last_seen > NOW() - INTERVAL '1 hour' THEN 'recent'
          ELSE 'offline'
        END as status
      FROM devices d
      LEFT JOIN ecg_sessions es ON d.device_id = es.device_id
      WHERE d.device_id = $1
      GROUP BY d.id
    `;
    
    const result = await req.app.locals.db.query(query, [deviceId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
});

// Register/Update device
router.post('/', async (req, res) => {
  try {
    const { error, value } = deviceSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message)
      });
    }

    const { deviceId, deviceName, firmwareVersion, batteryLevel, calibrationData } = value;

    const query = `
      INSERT INTO devices (device_id, device_name, firmware_version, battery_level, calibration_data, last_seen)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (device_id)
      DO UPDATE SET 
        device_name = COALESCE($2, devices.device_name),
        firmware_version = COALESCE($3, devices.firmware_version),
        battery_level = COALESCE($4, devices.battery_level),
        calibration_data = COALESCE($5, devices.calibration_data),
        last_seen = NOW(),
        is_active = true
      RETURNING *
    `;
    
    const result = await req.app.locals.db.query(query, [
      deviceId, deviceName, firmwareVersion, batteryLevel, JSON.stringify(calibrationData)
    ]);
    
    res.status(201).json({
      message: 'Device registered/updated successfully',
      device: result.rows[0]
    });
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

// Update device status (heartbeat)
router.post('/:deviceId/heartbeat', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { batteryLevel, firmwareVersion } = req.body;
    
    const query = `
      UPDATE devices 
      SET last_seen = NOW(),
          battery_level = COALESCE($2, battery_level),
          firmware_version = COALESCE($3, firmware_version),
          is_active = true
      WHERE device_id = $1
      RETURNING device_id, last_seen, battery_level, firmware_version
    `;
    
    const result = await req.app.locals.db.query(query, [deviceId, batteryLevel, firmwareVersion]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json({
      message: 'Device heartbeat updated',
      device: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating device heartbeat:', error);
    res.status(500).json({ error: 'Failed to update device heartbeat' });
  }
});

// Update device calibration
router.post('/:deviceId/calibration', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { calibrationData } = req.body;
    
    if (!calibrationData) {
      return res.status(400).json({ error: 'Calibration data is required' });
    }

    const query = `
      UPDATE devices 
      SET calibration_data = $2
      WHERE device_id = $1
      RETURNING device_id, calibration_data
    `;
    
    const result = await req.app.locals.db.query(query, [deviceId, JSON.stringify(calibrationData)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json({
      message: 'Device calibration updated',
      device: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating device calibration:', error);
    res.status(500).json({ error: 'Failed to update device calibration' });
  }
});

// Deactivate device
router.post('/:deviceId/deactivate', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const query = `
      UPDATE devices 
      SET is_active = false
      WHERE device_id = $1
      RETURNING device_id, is_active
    `;
    
    const result = await req.app.locals.db.query(query, [deviceId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json({
      message: 'Device deactivated',
      device: result.rows[0]
    });
  } catch (error) {
    console.error('Error deactivating device:', error);
    res.status(500).json({ error: 'Failed to deactivate device' });
  }
});

// Get device sessions history
router.get('/:deviceId/sessions', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT es.*, p.first_name, p.last_name,
        COUNT(edp.id) as data_points_count
      FROM ecg_sessions es
      JOIN patients p ON es.patient_id = p.id
      LEFT JOIN ecg_data_points edp ON es.id = edp.session_id
      WHERE es.device_id = $1
      GROUP BY es.id, p.first_name, p.last_name
      ORDER BY es.start_time DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await req.app.locals.db.query(query, [deviceId, limit, offset]);
    
    res.json({
      deviceId,
      sessions: result.rows,
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching device sessions:', error);
    res.status(500).json({ error: 'Failed to fetch device sessions' });
  }
});

// Get device statistics
router.get('/:deviceId/stats', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const query = `
      SELECT 
        COUNT(DISTINCT es.id) as total_sessions,
        COUNT(edp.id) as total_data_points,
        AVG(es.duration_seconds) as avg_session_duration,
        MAX(es.start_time) as last_session_date,
        MIN(es.start_time) as first_session_date
      FROM devices d
      LEFT JOIN ecg_sessions es ON d.device_id = es.device_id
      LEFT JOIN ecg_data_points edp ON es.id = edp.session_id
      WHERE d.device_id = $1
      GROUP BY d.id
    `;
    
    const result = await req.app.locals.db.query(query, [deviceId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching device statistics:', error);
    res.status(500).json({ error: 'Failed to fetch device statistics' });
  }
});

module.exports = router;