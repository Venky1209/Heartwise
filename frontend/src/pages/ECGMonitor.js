import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PlayIcon, 
  StopIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '../context/SocketContext';
import RealTimeECGChart from '../components/ECG/RealTimeECGChart';
import ConnectionModeSelector, { CONNECTION_MODES } from '../components/ConnectionModeSelector';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ECGMonitor = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { joinSession, leaveSession, isConnected, realtimeECGData, deviceStatus } = useSocket();
  const { user } = useAuth();
  
  const [isRecording, setIsRecording] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Connection mode state
  const [connectionMode, setConnectionMode] = useState(CONNECTION_MODES.WIFI);
  const [bleData, setBleData] = useState([]);
  const [bleConnected, setBleConnected] = useState(false);
  const [usbConnected, setUsbConnected] = useState(false);
  
  // Refs for control functions
  const bleControlRef = useRef(null);
  const usbControlRef = useRef(null);

  // Handle BLE data received
  const handleBLEData = useCallback((data) => {
    if (data.data && Array.isArray(data.data)) {
      // Data already has displayTime added by ConnectionModeSelector
      setBleData(prev => {
        const newData = [...prev, ...data.data];
        // Keep last 7500 points (30 seconds at 250 Hz)
        return newData.slice(-7500);
      });
    }
  }, []);

  // Handle BLE connection change
  const handleBLEConnectionChange = useCallback((connected, device) => {
    setBleConnected(connected);
    if (!connected) {
      setBleData([]);
    }
  }, []);

  // Handle USB data received
  const handleUSBData = useCallback((data) => {
    // Accept data in multiple formats:
    // 1. { type: 'ecg-data', data: [...] } - standard format
    // 2. { data: [...] } - simplified format
    // 3. Skip status/info messages
    
    console.log('📥 USB received:', data.type, data.data?.length || 0);
    
    if (data.type === 'status' || data.type === 'register' || data.type === 'heartbeat' || data.status || data.type === 'device-info') {
      console.log('  (status/info, skipping)');
      return;
    }
    
    // Extract data array from various formats
    let dataArray = null;
    if (data.data && Array.isArray(data.data)) {
      dataArray = data.data;
    } else if (Array.isArray(data)) {
      dataArray = data;
    }
    
    if (dataArray && dataArray.length > 0) {
      console.log('  Processing', dataArray.length, 'samples');
      const firstPoint = dataArray[0];
      const lastPoint = dataArray[dataArray.length - 1];
      console.log('  First point: V=' + firstPoint.voltage + ' mV, Q=' + firstPoint.quality + ', LO=' + firstPoint.leadsOff);
      console.log('  Last point: V=' + lastPoint.voltage + ' mV, Q=' + lastPoint.quality + ', LO=' + lastPoint.leadsOff);
      
      const now = Date.now();
      const dataWithDisplayTime = dataArray.map((point, index) => ({
        ...point,
        voltage: point.voltage ?? point.v ?? 0,
        displayTime: now - ((dataArray.length - 1 - index) * 4),
      }));
      
      console.log('  Data points mapped with displayTime:', {
        firstTime: new Date(dataWithDisplayTime[0].displayTime).toLocaleTimeString(),
        lastTime: new Date(dataWithDisplayTime[dataWithDisplayTime.length - 1].displayTime).toLocaleTimeString()
      });
      
      setBleData(prev => {
        const newData = [...prev, ...dataWithDisplayTime];
        console.log('  Total bleData now:', newData.length, 'points');
        return newData.slice(-7500);
      });
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    
    if (sessionId) {
      fetchSessionDetails(sessionId);
      joinSession(sessionId);
      setIsRecording(true);
    }

    return () => {
      if (sessionId) {
        leaveSession();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const fetchDevices = async () => {
    try {
      const response = await api.get('/devices');
      setDevices(response.data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to load devices');
    }
  };

  const fetchSessionDetails = async (id) => {
    try {
      const response = await api.get(`/sessions/${id}`);
      const session = response.data;
      setCurrentSession(session);
      
      setSelectedDevice(session.device_id || '');
      setSessionNotes(session.notes || '');
    } catch (error) {
      console.error('Error fetching session details:', error);
      toast.error('Failed to load session details');
    }
  };

  const startNewSession = async () => {
    // For BLE/USB modes, check if connected
    if (connectionMode === CONNECTION_MODES.BLE) {
      if (!bleControlRef.current?.isConnected()) {
        toast.error('Please connect to a Bluetooth device first');
        return;
      }
    }
    
    
    // For WiFi mode, require device selection
    if (connectionMode === CONNECTION_MODES.WIFI && !selectedDevice) {
      toast.error('Please select a device');
      return;
    }

    try {
      setLoading(true);
      
      const sessionData = {
        sessionName: `ECG Session - ${new Date().toLocaleDateString()}`,
        deviceId: connectionMode === CONNECTION_MODES.WIFI ? selectedDevice : `${connectionMode}-device`,
        notes: sessionNotes,
        sampleRate: 250
      };

      const response = await api.post('/sessions', sessionData);
      const newSession = response.data.session;
      
      setCurrentSession(newSession);
      
      // For BLE mode, send start command via BLE
      if (connectionMode === CONNECTION_MODES.BLE && bleControlRef.current) {
        const started = await bleControlRef.current.startRecording(newSession.id);
        if (!started) {
          toast.error('Failed to start BLE recording');
          return;
        }
      }
      
      // For USB mode, send start command via USB
      if (connectionMode === CONNECTION_MODES.USB && usbControlRef.current) {
        const started = await usbControlRef.current.startRecording(newSession.id);
        if (!started) {
          toast.error('Failed to start USB recording');
          return;
        }
      }
      
      // For WiFi mode, join socket session
      if (connectionMode === CONNECTION_MODES.WIFI) {
        joinSession(newSession.id);
      }
      
      setIsRecording(true);
      setRecordingDuration(0);
      
      toast.success('ECG session started successfully');
      
      // Only navigate for WiFi mode - BLE/USB need to keep their connection state
      if (connectionMode === CONNECTION_MODES.WIFI) {
        navigate(`/monitor/${newSession.id}`);
      } else {
        // For BLE/USB, update URL without full navigation to preserve connection
        window.history.replaceState(null, '', `/monitor/${newSession.id}`);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start ECG session');
    } finally {
      setLoading(false);
    }
  };

  const stopSession = async () => {
    if (!currentSession) return;

    try {
      setLoading(true);
      
      // Stop BLE recording if in BLE mode
      if (connectionMode === CONNECTION_MODES.BLE && bleControlRef.current) {
        await bleControlRef.current.stopRecording();
      }
      
      // Stop USB recording if in USB mode
      if (connectionMode === CONNECTION_MODES.USB && usbControlRef.current) {
        await usbControlRef.current.stopRecording();
      }
      
      // Save ECG data for USB/BLE modes (bleData contains the collected data)
      if ((connectionMode === CONNECTION_MODES.USB || connectionMode === CONNECTION_MODES.BLE) && bleData.length > 0) {
        console.log(`Saving ${bleData.length} ECG data points to database...`);
        
        // Format data for the bulk insert API
        // qualityScore must be 0-1 (not 0-100), so divide by 100 if needed
        const dataPoints = bleData.map(point => ({
          timestamp: point.timestamp || point.displayTime || Date.now(),
          voltage: point.voltage || 0,
          qualityScore: point.quality ? Math.min(point.quality / 100, 1) : 0.5,
          isArtifact: point.leadsOff || false
        }));
        
        // Send data in batches to avoid request size limits
        const batchSize = 1000;
        let savedCount = 0;
        for (let i = 0; i < dataPoints.length; i += batchSize) {
          const batch = dataPoints.slice(i, i + batchSize);
          try {
            const response = await api.post('/ecg-data/bulk', {
              sessionId: currentSession.id,
              dataPoints: batch
            });
            savedCount += batch.length;
            console.log(`Saved batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(dataPoints.length / batchSize)}`);
          } catch (err) {
            console.error('Error saving ECG batch:', err.response?.data || err.message);
          }
        }
        
        if (savedCount > 0) {
          toast.success(`Saved ${savedCount} ECG data points`);
        } else {
          toast.error('Failed to save ECG data');
        }
      }
      
      await api.put(`/sessions/${currentSession.id}`, {
        isCompleted: true,
        endTime: new Date().toISOString(),
        notes: sessionNotes
      });

      leaveSession();
      setIsRecording(false);
      setCurrentSession(null);
      setRecordingDuration(0);
      setBleData([]); // Clear BLE data
      
      toast.success('ECG session completed');
      navigate('/sessions');
    } catch (error) {
      console.error('Error stopping session:', error);
      toast.error('Failed to stop ECG session');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // const getOnlineDevices = () => {
  //   return devices.filter(device => {
  //     const status = deviceStatus[device.device_id];
  //     if (!status) return false;
  //     
  //     const lastSeen = new Date(status.lastUpdate);
  //     const now = new Date();
  //     const minutesAgo = (now - lastSeen) / (1000 * 60);
  //     
  //     return minutesAgo < 5; // Consider online if seen in last 5 minutes
  //   });
  // };

  const getDeviceStatus = (deviceId) => {
    // First check real-time Socket.IO status
    const realtimeStatus = deviceStatus[deviceId];
    if (realtimeStatus) {
      const lastSeen = new Date(realtimeStatus.lastUpdate);
      const now = new Date();
      const minutesAgo = (now - lastSeen) / (1000 * 60);
      
      if (minutesAgo < 5) return { text: 'Online', color: 'text-green-600' };
      if (minutesAgo < 60) return { text: 'Recent', color: 'text-yellow-600' };
      return { text: 'Offline', color: 'text-red-600' };
    }
    
    // Fall back to database status from the devices list
    const device = devices.find(d => d.device_id === deviceId);
    if (device && device.status) {
      if (device.status === 'online') return { text: 'Online', color: 'text-green-600' };
      if (device.status === 'recent') return { text: 'Recent', color: 'text-yellow-600' };
      if (device.status === 'offline') return { text: 'Offline', color: 'text-red-600' };
    }
    
    return { text: 'Unknown', color: 'text-gray-500' };
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ECG Monitor</h1>
        <p className="mt-2 text-gray-600">
          Real-time ECG monitoring and data collection
        </p>
      </div>

      {/* Connection Status Alert */}
      {!isConnected && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3" />
          <div>
            <p className="text-red-800 font-medium">Connection Lost</p>
            <p className="text-red-600 text-sm">Unable to connect to HeartWise server. Check your connection.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Control Panel */}
        <div className="lg:col-span-1">
          <div className="medical-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Session Control</h3>
            
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <p className="font-bold text-blue-900">Current Mode:</p>
              <p className="text-blue-700">{connectionMode.toUpperCase()}</p>
              {connectionMode === CONNECTION_MODES.USB && usbConnected && (
                <p className="text-green-600">✅ USB Connected</p>
              )}
              {connectionMode === CONNECTION_MODES.USB && !usbConnected && (
                <p className="text-red-600">❌ USB Not Connected - Click button below</p>
              )}
            </div>
            
            {/* ConnectionModeSelector must stay mounted to maintain USB/BLE connection */}
            {/* Hide it visually during recording but keep it in the DOM */}
            <div className={isRecording ? 'hidden' : ''}>
              <ConnectionModeSelector
                currentMode={connectionMode}
                onModeChange={setConnectionMode}
                onBLEData={handleBLEData}
                onBLEConnectionChange={handleBLEConnectionChange}
                onUSBData={handleUSBData}
                onUSBConnectionChange={setUsbConnected}
                disabled={isRecording}
                bleControlRef={bleControlRef}
                usbControlRef={usbControlRef}
              />
            </div>

            {!isRecording ? (
              <div className="space-y-4">
                {/* User Info Display */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900">Recording as:</p>
                  <p className="text-lg font-semibold text-blue-700">
                    {user?.first_name} {user?.last_name || user?.email}
                  </p>
                </div>

                {/* Device Selection - Only show for WiFi mode */}
                {connectionMode === CONNECTION_MODES.WIFI && (
                <div>
                  <label className="form-label">Select Device</label>
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="form-input"
                    disabled={loading}
                  >
                    <option value="">Choose a device...</option>
                    {devices.map(device => {
                      const status = getDeviceStatus(device.device_id);
                      return (
                        <option key={device.device_id} value={device.device_id}>
                          {device.device_name || device.device_id} ({status.text})
                        </option>
                      );
                    })}
                  </select>
                  
                  {devices.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      No devices found. Ensure your ECG device is connected.
                    </p>
                  )}
                </div>
                )}

                {/* Session Notes */}
                <div>
                  <label className="form-label">Session Notes (Optional)</label>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    className="form-input"
                    rows={3}
                    placeholder="Enter any notes about this session..."
                    disabled={loading}
                  />
                </div>

                {/* Start Button */}
                <button
                  onClick={startNewSession}
                  disabled={
                    loading || 
                    ((connectionMode === CONNECTION_MODES.WIFI || connectionMode === CONNECTION_MODES.USB) && (!selectedDevice || !isConnected)) ||
                    (connectionMode === CONNECTION_MODES.BLE && !bleConnected)
                  }
                  className="w-full btn-success flex items-center justify-center"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  {loading ? 'Starting...' : 'Start ECG Session'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Current Session Info */}
                {currentSession && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="font-medium text-green-800">
                        {user?.first_name} {user?.last_name || user?.email}
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      <ClockIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-700">
                        Duration: {formatDuration(recordingDuration)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <DevicePhoneMobileIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-700">
                        Device: {selectedDevice.substring(0, 8)}...
                      </span>
                    </div>
                  </div>
                )}

                {/* Recording Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Data Points</p>
                    <p className="text-xl font-bold text-blue-800">
                      {connectionMode === CONNECTION_MODES.WIFI ? realtimeECGData.length : bleData.length}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Quality</p>
                    <p className="text-xl font-bold text-green-800">
                      {(connectionMode === CONNECTION_MODES.WIFI ? realtimeECGData.length : bleData.length) > 0 ? 'Good' : 'No Signal'}
                    </p>
                  </div>
                </div>

                {/* Session Notes */}
                <div>
                  <label className="form-label">Session Notes</label>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    className="form-input"
                    rows={3}
                    placeholder="Add notes during the session..."
                  />
                </div>

                {/* Stop Button */}
                <button
                  onClick={stopSession}
                  disabled={loading}
                  className="w-full btn-danger flex items-center justify-center"
                >
                  <StopIcon className="h-5 w-5 mr-2" />
                  {loading ? 'Stopping...' : 'Stop Session'}
                </button>
              </div>
            )}
          </div>

          {/* Device Status */}
          <div className="medical-card mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Device Status</h3>
            
            {devices.length > 0 ? (
              <div className="space-y-3">
                {devices.slice(0, 5).map(device => {
                  const status = getDeviceStatus(device.device_id);
                  const deviceInfo = deviceStatus[device.device_id];
                  
                  return (
                    <div key={device.device_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {device.device_name || `Device ${device.device_id.substring(0, 8)}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {device.device_id}
                        </p>
                        {deviceInfo && (
                          <p className="text-xs text-gray-500">
                            Battery: {deviceInfo.batteryLevel}%
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <DevicePhoneMobileIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-500">No devices found</p>
                <p className="text-xs text-gray-400">Connect your ECG device to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Real-time ECG Chart */}
        <div className="lg:col-span-2">
          <RealTimeECGChart 
            sessionId={currentSession?.id} 
            height={500}
            externalData={connectionMode !== CONNECTION_MODES.WIFI ? bleData : null}
          />
        </div>
      </div>
    </div>
  );
};

export default ECGMonitor;