#!/usr/bin/env node

/**
 * HeartWise ECG Test Script
 * Creates a test session and starts recording from ESP32
 */

const io = require('socket.io-client');
const axios = require('axios');

const BACKEND_URL = 'http://localhost:5001';
const SOCKET_URL = 'ws://localhost:5001';

async function main() {
  console.log('🏥 HeartWise ECG Test Script\n');

  try {
    // Step 1: Create a test patient
    console.log('1️⃣  Creating test patient...');
    const patientResponse = await axios.post(`${BACKEND_URL}/api/patients`, {
      firstName: 'Test',
      lastName: 'Patient',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      contactNumber: '555-0100',
      email: 'test@heartwise.com',
      medicalConditions: 'Testing ECG system'
    });
    const patientId = patientResponse.data.id;
    console.log(`✓ Patient created: ${patientId}\n`);

    // Step 2: Create a recording session
    console.log('2️⃣  Creating recording session...');
    const sessionResponse = await axios.post(`${BACKEND_URL}/api/sessions`, {
      patientId: patientId,
      deviceId: 'HEARTWISE-ESP32-01-050',
      duration: 60, // 60 seconds
      notes: 'Test recording'
    });
    const sessionId = sessionResponse.data.id;
    console.log(`✓ Session created: ${sessionId}\n`);

    // Step 3: Connect to WebSocket
    console.log('3️⃣  Connecting to WebSocket...');
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log(`✓ WebSocket connected: ${socket.id}\n`);

      // Join session room
      socket.emit('join-session', sessionId);
      console.log(`✓ Joined session room: ${sessionId}\n`);

      // Send start recording command to ESP32
      console.log('4️⃣  Sending start recording command to ESP32...');
      socket.emit('start-recording', {
        sessionId: sessionId,
        deviceId: 'HEARTWISE-ESP32-01-050'
      });
      console.log('✓ Command sent!\n');

      console.log('📊 Listening for real-time ECG data...\n');
      console.log('Press Ctrl+C to stop\n');
      console.log('─'.repeat(50));
    });

    // Listen for real-time ECG data
    let dataPointCount = 0;
    socket.on('real-time-ecg', (data) => {
      dataPointCount++;
      
      if (Array.isArray(data.data)) {
        // Batch data
        console.log(`📈 Received batch: ${data.data.length} samples`);
        console.log(`   Session: ${data.sessionId}`);
        console.log(`   Device: ${data.deviceId}`);
        console.log(`   Total points: ${dataPointCount}`);
        
        // Show first sample from batch
        if (data.data.length > 0) {
          const sample = data.data[0];
          console.log(`   Sample: ${sample.voltage}mV @ ${sample.timestamp}ms`);
        }
      } else {
        // Single data point
        console.log(`📈 ECG Data Point #${dataPointCount}`);
        console.log(`   Voltage: ${data.voltage}mV`);
        console.log(`   Timestamp: ${data.timestamp}ms`);
      }
      console.log('─'.repeat(50));
    });

    socket.on('disconnect', () => {
      console.log('\n⚠️  WebSocket disconnected');
    });

    socket.on('error', (error) => {
      console.error('\n❌ WebSocket error:', error);
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Stopping recording...');
      
      // Send stop recording command
      socket.emit('stop-recording', {
        sessionId: sessionId,
        deviceId: 'HEARTWISE-ESP32-01-050'
      });

      // Update session end time
      await axios.patch(`${BACKEND_URL}/api/sessions/${sessionId}`, {
        endTime: new Date().toISOString()
      });

      console.log('✓ Recording stopped');
      console.log(`\n📊 Session Summary:`);
      console.log(`   Session ID: ${sessionId}`);
      console.log(`   Patient ID: ${patientId}`);
      console.log(`   Total batches: ${dataPointCount}`);
      
      socket.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

main();
