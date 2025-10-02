import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PlayIcon, 
  StopIcon,
  UserIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '../context/SocketContext';
import RealTimeECGChart from '../components/ECG/RealTimeECGChart';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ECGMonitor = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { joinSession, leaveSession, isConnected, realtimeECGData, deviceStatus } = useSocket();
  
  const [isRecording, setIsRecording] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
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

  const fetchPatients = async () => {
    try {
      const response = await api.get('/api/patients?limit=50');
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await api.get('/api/devices');
      setDevices(response.data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to load devices');
    }
  };

  const fetchSessionDetails = async (id) => {
    try {
      const response = await api.get(`/api/sessions/${id}`);
      const session = response.data;
      setCurrentSession(session);
      
      // Find and set the patient
      const patient = patients.find(p => p.id === session.patient_id);
      if (patient) {
        setSelectedPatient(patient);
      }
      
      setSelectedDevice(session.device_id || '');
      setSessionNotes(session.notes || '');
    } catch (error) {
      console.error('Error fetching session details:', error);
      toast.error('Failed to load session details');
    }
  };

  const startNewSession = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    if (!selectedDevice) {
      toast.error('Please select a device');
      return;
    }

    try {
      setLoading(true);
      
      const sessionData = {
        patientId: selectedPatient.id,
        sessionName: `ECG Session - ${new Date().toLocaleDateString()}`,
        deviceId: selectedDevice,
        notes: sessionNotes,
        sampleRate: 250
      };

      const response = await api.post('/api/sessions', sessionData);
      const newSession = response.data.session;
      
      setCurrentSession(newSession);
      joinSession(newSession.id);
      setIsRecording(true);
      setRecordingDuration(0);
      
      toast.success('ECG session started successfully');
      navigate(`/monitor/${newSession.id}`);
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
      
      await api.put(`/api/sessions/${currentSession.id}`, {
        isCompleted: true,
        endTime: new Date().toISOString(),
        notes: sessionNotes
      });

      leaveSession();
      setIsRecording(false);
      setCurrentSession(null);
      setRecordingDuration(0);
      
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
    const status = deviceStatus[deviceId];
    if (!status) return { text: 'Unknown', color: 'text-gray-500' };
    
    const lastSeen = new Date(status.lastUpdate);
    const now = new Date();
    const minutesAgo = (now - lastSeen) / (1000 * 60);
    
    if (minutesAgo < 5) return { text: 'Online', color: 'text-green-600' };
    if (minutesAgo < 60) return { text: 'Recent', color: 'text-yellow-600' };
    return { text: 'Offline', color: 'text-red-600' };
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
            
            {!isRecording ? (
              <div className="space-y-4">
                {/* Patient Selection */}
                <div>
                  <label className="form-label">Select Patient</label>
                  <select
                    value={selectedPatient?.id || ''}
                    onChange={(e) => {
                      const patient = patients.find(p => p.id === e.target.value);
                      setSelectedPatient(patient);
                    }}
                    className="form-input"
                    disabled={loading}
                  >
                    <option value="">Choose a patient...</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Device Selection */}
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
                  disabled={!selectedPatient || !selectedDevice || loading || !isConnected}
                  className="w-full btn-success flex items-center justify-center"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  {loading ? 'Starting...' : 'Start ECG Session'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Current Session Info */}
                {currentSession && selectedPatient && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <UserIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">
                        {selectedPatient.first_name} {selectedPatient.last_name}
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
                    <p className="text-xl font-bold text-blue-800">{realtimeECGData.length}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Quality</p>
                    <p className="text-xl font-bold text-green-800">
                      {realtimeECGData.length > 0 ? 'Good' : 'No Signal'}
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
          />
        </div>
      </div>
    </div>
  );
};

export default ECGMonitor;