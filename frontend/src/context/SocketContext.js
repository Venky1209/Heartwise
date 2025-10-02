import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeECGData, setRealtimeECGData] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState({});
  const [currentSession, setCurrentSession] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001', {
      transports: ['websocket'],
      upgrade: false,
    });

    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      setIsConnected(true);
      toast.success('Connected to HeartWise server');
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      toast.error('Disconnected from server');
      console.log('Socket disconnected');
    });

    newSocket.on('connect_error', (error) => {
      setIsConnected(false);
      toast.error('Connection failed: ' + error.message);
      console.error('Socket connection error:', error);
    });

    // ECG data event handlers
    newSocket.on('real-time-ecg', (data) => {
      console.log('📥 Received real-time-ecg event:', data);
      console.log('📊 Data points count:', data.data?.length);
      console.log('📍 First point:', data.data?.[0]);
      
      setRealtimeECGData(prevData => {
        // Extract the ECG data points from the received data
        const newPoints = Array.isArray(data.data) ? data.data : [];
        
        if (newPoints.length === 0) return prevData;
        
        // Calculate proper timestamps based on sample rate (250 Hz = 4ms per sample)
        const sampleIntervalMs = 4; // 1000ms / 250 Hz = 4ms per sample
        
        // If we have previous data, continue from the last timestamp
        // Otherwise, start from current time
        let baseTime;
        if (prevData.length > 0 && prevData[prevData.length - 1].displayTime) {
          // Continue from last point + one sample interval
          baseTime = prevData[prevData.length - 1].displayTime + sampleIntervalMs;
        } else {
          baseTime = Date.now();
        }
        
        // Assign sequential timestamps to each point
        const pointsWithTimestamp = newPoints.map((point, index) => ({
          ...point,
          displayTime: baseTime + (index * sampleIntervalMs)
        }));
        
        console.log('✅ Adding', pointsWithTimestamp.length, 'points to chart');
        console.log('🕐 Base time:', new Date(baseTime).toISOString());
        console.log('🕐 First point displayTime:', new Date(pointsWithTimestamp[0].displayTime).toISOString());
        console.log('🕐 Last point displayTime:', new Date(pointsWithTimestamp[pointsWithTimestamp.length - 1].displayTime).toISOString());
        console.log('🕐 Current time:', new Date().toISOString());
        
        const combined = [...prevData, ...pointsWithTimestamp];
        // Keep only the last 7500 data points (30 seconds at 250 Hz)
        const sliced = combined.slice(-7500);
        console.log('📈 Total chart points:', sliced.length);
        return sliced;
      });
    });

    // Device status event handlers
    newSocket.on('device-update', (data) => {
      setDeviceStatus(prevStatus => ({
        ...prevStatus,
        [data.deviceId]: {
          ...data,
          lastUpdate: new Date(),
        }
      }));
    });

    // Error handling
    newSocket.on('error', (error) => {
      toast.error('Server error: ' + error);
      console.error('Socket error:', error);
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  const joinSession = (sessionId) => {
    if (socket && sessionId) {
      socket.emit('join-session', sessionId);
      setCurrentSession(sessionId);
      setRealtimeECGData([]); // Clear previous data
      toast.success(`Joined ECG session: ${sessionId.substring(0, 8)}...`);
    }
  };

  const leaveSession = () => {
    if (currentSession) {
      setCurrentSession(null);
      setRealtimeECGData([]);
      toast('Left ECG session', { icon: 'ℹ️' });
    }
  };

  const sendECGData = (data) => {
    if (socket && isConnected) {
      socket.emit('ecg-data', data);
    }
  };

  const sendDeviceStatus = (status) => {
    if (socket && isConnected) {
      socket.emit('device-status', status);
    }
  };

  const clearECGData = () => {
    setRealtimeECGData([]);
  };

  const value = {
    socket,
    isConnected,
    realtimeECGData,
    deviceStatus,
    currentSession,
    joinSession,
    leaveSession,
    sendECGData,
    sendDeviceStatus,
    clearECGData,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};