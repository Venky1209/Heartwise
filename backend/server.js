const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { Pool } = require('pg');

// Import routes
const patientsRouter = require('./routes/patients');
const sessionsRouter = require('./routes/sessions');
const ecgDataRouter = require('./routes/ecgData');
const devicesRouter = require('./routes/devices');
const analysisRouter = require('./routes/analysis');

// Environment configuration
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'heartwise_ecg',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL database:', err);
  } else {
    console.log('Successfully connected to PostgreSQL database');
    release();
  }
});

// Store active ESP32 WebSocket connections
const esp32Connections = new Map(); // deviceId -> WebSocket connection

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Make database pool available to routes
app.locals.db = pool;
app.locals.esp32Connections = esp32Connections;

// Routes
app.use('/api/patients', patientsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/ecg-data', ecgDataRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/analysis', analysisRouter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      timestamp: result.rows[0].now,
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Socket.IO for real-time ECG data
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join a session room for real-time ECG streaming
  socket.on('join-session', (sessionId) => {
    socket.join(`session-${sessionId}`);
    console.log(`Client ${socket.id} joined session ${sessionId}`);
  });

  // Handle real-time ECG data from ESP32
  socket.on('ecg-data', async (data) => {
    try {
      const { sessionId, voltage, timestamp, deviceId } = data;
      
      // Validate data
      if (!sessionId || voltage === undefined || !timestamp) {
        socket.emit('error', 'Invalid ECG data format');
        return;
      }

      // Store in database
      const query = `
        INSERT INTO ecg_data_points (session_id, timestamp_ms, voltage_mv, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, timestamp_ms, voltage_mv
      `;
      
      const result = await pool.query(query, [sessionId, timestamp, voltage]);
      const savedData = result.rows[0];

      // Broadcast to all clients in the session room
      io.to(`session-${sessionId}`).emit('real-time-ecg', {
        id: savedData.id,
        sessionId,
        timestamp: savedData.timestamp_ms,
        voltage: savedData.voltage_mv,
        deviceId
      });

    } catch (error) {
      console.error('Error processing ECG data:', error);
      socket.emit('error', 'Failed to process ECG data');
    }
  });

  // Handle ESP32 device status updates
  socket.on('device-status', async (data) => {
    try {
      const { deviceId, batteryLevel, firmwareVersion } = data;
      
      const query = `
        INSERT INTO devices (device_id, battery_level, firmware_version, last_seen)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (device_id)
        DO UPDATE SET 
          battery_level = $2,
          firmware_version = $3,
          last_seen = NOW()
      `;
      
      await pool.query(query, [deviceId, batteryLevel, firmwareVersion]);
      
      // Broadcast device status to monitoring dashboard
      io.emit('device-update', {
        deviceId,
        batteryLevel,
        firmwareVersion,
        lastSeen: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error updating device status:', error);
      socket.emit('error', 'Failed to update device status');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ===========================================
// Plain WebSocket Server for ESP32
// ===========================================
const wss = new WebSocket.Server({ 
  noServer: true  // We'll handle upgrade manually
});

// Handle WebSocket upgrade requests
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  
  // Only handle /ws/esp32 path with plain WebSocket
  if (pathname === '/ws/esp32') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
  // Let Socket.IO handle its own paths (/socket.io/...)
  // Other paths will be rejected automatically
});

wss.on('connection', (ws, req) => {
  console.log('🔌 ESP32 WebSocket connected:', req.socket.remoteAddress);
  
  let deviceId = null;
  let currentSessionId = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // 🔍 LOG ALL MESSAGES FROM ESP32
      console.log(`📥 ESP32 Message Type: ${data.type}`);
      
      // Handle device registration
      if (data.type === 'register') {
        deviceId = data.deviceId;
        console.log(`✓ ESP32 Device registered: ${deviceId}`);
        
        // Store connection in map
        esp32Connections.set(deviceId, ws);
        
        // Register device in database
        const query = `
          INSERT INTO devices (device_id, firmware_version, last_seen)
          VALUES ($1, $2, NOW())
          ON CONFLICT (device_id)
          DO UPDATE SET last_seen = NOW(), firmware_version = $2
          RETURNING id
        `;
        await pool.query(query, [deviceId, data.firmwareVersion || '1.0.0']);
        
        ws.send(JSON.stringify({ 
          type: 'registered', 
          deviceId,
          message: 'Device registered successfully'
        }));
        
        // Broadcast to Socket.IO clients
        io.emit('device-update', {
          deviceId,
          status: 'online',
          lastSeen: new Date().toISOString()
        });
      }
      
      // Handle ECG data
      else if (data.type === 'ecg-data') {
        const { sessionId, data: ecgPoints } = data;
        currentSessionId = sessionId;
        
        if (!Array.isArray(ecgPoints) || ecgPoints.length === 0) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid ECG data' }));
          return;
        }
        
        // Batch insert ECG data using parameterized query
        const values = ecgPoints.map((point, index) => {
          const offset = index * 3;
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, NOW())`;
        }).join(',');
        
        const params = ecgPoints.flatMap(point => [
          sessionId,
          point.timestamp,
          point.voltage
        ]);
        
        const query = `
          INSERT INTO ecg_data_points (session_id, timestamp_ms, voltage_mv, created_at)
          VALUES ${values}
        `;
        
        await pool.query(query, params);
        
        // Broadcast to Socket.IO clients in session room
        io.to(`session-${sessionId}`).emit('real-time-ecg', {
          sessionId,
          data: ecgPoints,
          deviceId
        });
        
        // Acknowledge receipt
        ws.send(JSON.stringify({ 
          type: 'ack', 
          received: ecgPoints.length 
        }));
      }
      
      // Handle heartbeat
      else if (data.type === 'heartbeat') {
        ws.send(JSON.stringify({ type: 'pong' }));
        
        // Update device last seen
        if (deviceId) {
          await pool.query(
            'UPDATE devices SET last_seen = NOW() WHERE device_id = $1',
            [deviceId]
          );
        }
      }
      
      // Handle start recording command
      else if (data.type === 'start-recording') {
        currentSessionId = data.sessionId;
        ws.send(JSON.stringify({ 
          type: 'recording-started',
          sessionId: currentSessionId 
        }));
      }
      
      // Handle stop recording command
      else if (data.type === 'stop-recording') {
        ws.send(JSON.stringify({ 
          type: 'recording-stopped' 
        }));
        currentSessionId = null;
      }
      
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: error.message 
      }));
    }
  });

  ws.on('close', () => {
    console.log(`🔌 ESP32 disconnected: ${deviceId || 'unknown'}`);
    
    // Remove from connections map
    if (deviceId) {
      esp32Connections.delete(deviceId);
    }
    
    // Broadcast device offline status
    if (deviceId) {
      io.emit('device-update', {
        deviceId,
        status: 'offline',
        lastSeen: new Date().toISOString()
      });
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send welcome message
  ws.send(JSON.stringify({ 
    type: 'connected',
    message: 'Connected to HeartWise Backend',
    timestamp: Date.now()
  }));
});

console.log('🔌 Plain WebSocket server ready for ESP32 on /ws/esp32');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🏥 HeartWise Backend Server running on port ${PORT}`);
  console.log(`📊 Socket.IO enabled for real-time ECG streaming`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
  console.log(`🌐 Server accessible on all network interfaces (0.0.0.0:${PORT})`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    pool.end(() => {
      console.log('Database connections closed');
      process.exit(0);
    });
  });
});

module.exports = { app, server, io, pool };