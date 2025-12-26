import React, { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

// BLE UUIDs (must match ESP32 code)
const SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
const ECG_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef1';
const CONTROL_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef2';
const DEVICE_INFO_UUID = '12345678-1234-5678-1234-56789abcdef3';

const BLEConnection = ({ onDataReceived, onConnectionChange, onDeviceInfo }) => {
  const [isSupported, setIsSupported] = useState('bluetooth' in navigator);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const deviceRef = useRef(null);
  const ecgCharRef = useRef(null);
  const controlCharRef = useRef(null);
  
  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setDeviceName(null);
    setIsRecording(false);
    deviceRef.current = null;
    ecgCharRef.current = null;
    controlCharRef.current = null;
    onConnectionChange?.(false);
    toast.error('BLE device disconnected');
  }, [onConnectionChange]);
  
  const connectBLE = async () => {
    if (!isSupported) {
      toast.error('Bluetooth is not supported in this browser');
      return;
    }
    
    setIsConnecting(true);
    
    try {
      // Request BLE device
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'HeartWise' },
          { services: [SERVICE_UUID] }
        ],
        optionalServices: [SERVICE_UUID]
      });
      
      deviceRef.current = device;
      device.addEventListener('gattserverdisconnected', handleDisconnect);
      
      // Connect to GATT server
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      
      // Get characteristics
      const ecgChar = await service.getCharacteristic(ECG_CHAR_UUID);
      const controlChar = await service.getCharacteristic(CONTROL_CHAR_UUID);
      const infoChar = await service.getCharacteristic(DEVICE_INFO_UUID);
      
      ecgCharRef.current = ecgChar;
      controlCharRef.current = controlChar;
      
      // Read device info
      const infoValue = await infoChar.readValue();
      const infoText = new TextDecoder().decode(infoValue);
      const deviceInfo = JSON.parse(infoText);
      onDeviceInfo?.(deviceInfo);
      
      // Subscribe to ECG notifications
      await ecgChar.startNotifications();
      ecgChar.addEventListener('characteristicvaluechanged', handleECGData);
      
      setDeviceName(device.name || deviceInfo.deviceId);
      setIsConnected(true);
      onConnectionChange?.(true, deviceInfo);
      toast.success(`Connected to ${device.name}`);
      
    } catch (error) {
      console.error('BLE connection error:', error);
      if (error.name !== 'NotFoundError') {
        toast.error(`Connection failed: ${error.message}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };
  
  const disconnectBLE = async () => {
    if (deviceRef.current?.gatt?.connected) {
      if (isRecording) {
        await stopRecording();
      }
      deviceRef.current.gatt.disconnect();
    }
    handleDisconnect();
  };
  
  const handleECGData = (event) => {
    const value = event.target.value;
    const text = new TextDecoder().decode(value);
    
    try {
      const data = JSON.parse(text);
      onDataReceived?.(data);
    } catch (error) {
      console.error('Failed to parse BLE data:', error);
    }
  };
  
  const startRecording = async (sessionId) => {
    if (!controlCharRef.current) return;
    
    try {
      const command = JSON.stringify({
        cmd: 'start',
        sessionId: sessionId || `ble-${Date.now()}`
      });
      
      await controlCharRef.current.writeValue(new TextEncoder().encode(command));
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to start recording');
    }
  };
  
  const stopRecording = async () => {
    if (!controlCharRef.current) return;
    
    try {
      const command = JSON.stringify({ cmd: 'stop' });
      await controlCharRef.current.writeValue(new TextEncoder().encode(command));
      setIsRecording(false);
      toast.success('Recording stopped');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      toast.error('Failed to stop recording');
    }
  };
  
  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-yellow-700">
            Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold">Bluetooth Connection</h3>
        </div>
        
        {isConnected && (
          <span className="flex items-center text-green-600 text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Connected
          </span>
        )}
      </div>
      
      {!isConnected ? (
        <button
          onClick={connectBLE}
          disabled={isConnecting}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <>
              <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.71 7.71L12 2.29V7c0 .55-.45 1-1 1H9.41l8.3 8.3zM12 12.41L6.29 6.71C5.9 6.32 5.26 6.32 4.87 6.71C4.48 7.1 4.48 7.74 4.87 8.13L10.59 13.85L4.87 19.56C4.48 19.95 4.48 20.59 4.87 20.98C5.26 21.37 5.9 21.37 6.29 20.98L12 15.27L17.71 20.98C18.1 21.37 18.74 21.37 19.13 20.98C19.52 20.59 19.52 19.95 19.13 19.56L13.41 13.85L19.13 8.13C19.52 7.74 19.52 7.1 19.13 6.71C18.74 6.32 18.1 6.32 17.71 6.71L12 12.41Z"/>
              </svg>
              Connect via Bluetooth
            </>
          )}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{deviceName}</p>
                <p className="text-sm text-gray-500">HeartWise ECG Monitor</p>
              </div>
              <button
                onClick={disconnectBLE}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Disconnect
              </button>
            </div>
          </div>
          
          <div className="flex gap-3">
            {!isRecording ? (
              <button
                onClick={() => startRecording()}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12"/>
                </svg>
                Stop Recording
              </button>
            )}
          </div>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        Make sure your HeartWise device is in BLE mode (Mode 1)
      </p>
    </div>
  );
};

export default BLEConnection;

// Hook for using BLE connection in other components
export const useBLEConnection = () => {
  const [bleData, setBleData] = useState([]);
  const [bleDevice, setBleDevice] = useState(null);
  const [bleConnected, setBleConnected] = useState(false);
  
  const handleData = useCallback((data) => {
    if (data.data) {
      setBleData(prev => [...prev, ...data.data].slice(-7500)); // Keep last 30 seconds
    }
  }, []);
  
  const handleConnectionChange = useCallback((connected, device) => {
    setBleConnected(connected);
    setBleDevice(connected ? device : null);
    if (!connected) {
      setBleData([]);
    }
  }, []);
  
  return {
    bleData,
    bleDevice,
    bleConnected,
    handleData,
    handleConnectionChange,
    clearData: () => setBleData([])
  };
};
