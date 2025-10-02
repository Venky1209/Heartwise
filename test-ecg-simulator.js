// HeartWise ECG Test Data Simulator
// Run this in a browser console or as a Node.js script

const io = require('socket.io-client');

const socket = io('http://localhost:5001');

socket.on('connect', () => {
  console.log('✓ Connected to HeartWise backend');
  console.log('Socket ID:', socket.id);
  
  // Register fake device
  socket.emit('device-status', {
    deviceId: 'TEST-DEVICE-001',
    deviceName: 'Test ECG Simulator',
    status: 'online',
    batteryLevel: 100,
    signalStrength: -45,
    firmwareVersion: '1.0.0-test',
    sampleRate: 250
  });
  
  console.log('✓ Device registered');
  
  // Simulate ECG data
  let timestamp = 0;
  setInterval(() => {
    const dataPoints = [];
    
    for (let i = 0; i < 25; i++) {
      // Generate simulated ECG waveform
      const t = timestamp + i;
      const ecgSignal = generateECGWaveform(t);
      
      dataPoints.push({
        timestamp: Date.now() + i * 4,
        voltage_mv: ecgSignal,
        leads_off: false,
        quality_score: 95
      });
    }
    
    socket.emit('ecg-data', {
      sessionId: 'test-session',
      deviceId: 'TEST-DEVICE-001',
      data: dataPoints
    });
    
    timestamp += 25;
    
    if (timestamp % 250 === 0) {
      console.log(`✓ Sent ${timestamp} samples`);
    }
  }, 100); // Send every 100ms (25 samples at 250Hz)
});

// Generate realistic ECG waveform
function generateECGWaveform(t) {
  const heartRate = 75; // bpm
  const period = (60 * 250) / heartRate; // samples per beat
  const phase = (t % period) / period;
  
  let voltage = 0;
  
  // P wave (0.05-0.15)
  if (phase >= 0.05 && phase < 0.15) {
    const pPhase = (phase - 0.05) / 0.1;
    voltage += 0.15 * Math.sin(pPhase * Math.PI);
  }
  
  // QRS complex (0.20-0.30)
  if (phase >= 0.20 && phase < 0.30) {
    const qrsPhase = (phase - 0.20) / 0.1;
    if (qrsPhase < 0.3) {
      voltage -= 0.2; // Q wave
    } else if (qrsPhase < 0.7) {
      voltage += 1.5 * ((qrsPhase - 0.3) / 0.4); // R wave
    } else {
      voltage -= 0.3; // S wave
    }
  }
  
  // T wave (0.40-0.60)
  if (phase >= 0.40 && phase < 0.60) {
    const tPhase = (phase - 0.40) / 0.2;
    voltage += 0.25 * Math.sin(tPhase * Math.PI);
  }
  
  // Add baseline noise
  voltage += (Math.random() - 0.5) * 0.05;
  
  return voltage;
}

socket.on('disconnect', () => {
  console.log('✗ Disconnected');
});

console.log('🏥 HeartWise ECG Test Simulator Started');
console.log('Connecting to http://localhost:5001...');
