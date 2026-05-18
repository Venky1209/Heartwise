import React, { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// BLE UUIDs (must match ESP32 code)
const SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
const ECG_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef1';
const CONTROL_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef2';
const DEVICE_INFO_UUID = '12345678-1234-5678-1234-56789abcdef3';

// Connection modes
export const CONNECTION_MODES = {
  WIFI: 'wifi',
  BLE: 'ble',
  USB: 'usb'
};

const ConnectionModeSelector = ({ 
  onModeChange, 
  onBLEData, 
  onBLEConnectionChange,
  onUSBData,
  onUSBConnectionChange,
  currentMode = CONNECTION_MODES.WIFI,
  disabled = false,
  bleControlRef = null, // Ref to expose BLE control functions
  usbControlRef = null  // Ref to expose USB control functions
}) => {
  const [selectedMode, setSelectedMode] = useState(currentMode);
  const [bleConnected, setBleConnected] = useState(false);
  const [bleConnecting, setBleConnecting] = useState(false);
  const [bleDevice, setBleDevice] = useState(null);
  const [usbConnected, setUsbConnected] = useState(false);
  const [bleSupported] = useState('bluetooth' in navigator);
  const [serialSupported] = useState('serial' in navigator);
  
  const bleDeviceRef = useRef(null);
  const ecgCharRef = useRef(null);
  const controlCharRef = useRef(null);
  const serialPortRef = useRef(null);
  const serialReaderRef = useRef(null);

  // Expose BLE control functions via ref
  useEffect(() => {
    if (bleControlRef) {
      bleControlRef.current = {
        startRecording: async (sessionId) => {
          if (!controlCharRef.current || !bleConnected) return false;
          try {
            const cmd = JSON.stringify({ cmd: 'start', sessionId: sessionId || `ble-${Date.now()}` });
            await controlCharRef.current.writeValue(new TextEncoder().encode(cmd));
            toast.success('BLE recording started');
            return true;
          } catch (e) {
            console.error('BLE start command failed:', e);
            toast.error('Failed to start BLE recording');
            return false;
          }
        },
        stopRecording: async () => {
          if (!controlCharRef.current || !bleConnected) return false;
          try {
            const cmd = JSON.stringify({ cmd: 'stop' });
            await controlCharRef.current.writeValue(new TextEncoder().encode(cmd));
            toast.success('BLE recording stopped');
            return true;
          } catch (e) {
            console.error('BLE stop command failed:', e);
            return false;
          }
        },
        isConnected: () => bleConnected
      };
    }
  }, [bleConnected, bleControlRef]);

  // Expose USB control functions via ref
  useEffect(() => {
    if (usbControlRef) {
      usbControlRef.current = {
        startRecording: async (sessionId) => {
          if (!serialPortRef.current || !usbConnected) return false;
          try {
            const writer = serialPortRef.current.writable.getWriter();
            // Send simple START command that ESP32 can reliably parse
            await writer.write(new TextEncoder().encode('START\n'));
            writer.releaseLock();
            toast.success('USB recording started');
            return true;
          } catch (e) {
            console.error('USB start command failed:', e);
            toast.error('Failed to start USB recording');
            return false;
          }
        },
        stopRecording: async () => {
          if (!serialPortRef.current || !usbConnected) return false;
          try {
            const writer = serialPortRef.current.writable.getWriter();
            // Send simple STOP command
            await writer.write(new TextEncoder().encode('STOP\n'));
            writer.releaseLock();
            toast.success('USB recording stopped');
            return true;
          } catch (e) {
            console.error('USB stop command failed:', e);
            return false;
          }
        },
        isConnected: () => usbConnected
      };
    }
  }, [usbConnected, usbControlRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectBLE();
      disconnectUSB();
    };
  }, []);

  const handleModeChange = (mode) => {
    // Disconnect from current mode first
    if (selectedMode === CONNECTION_MODES.BLE && bleConnected) {
      disconnectBLE();
    }
    if (selectedMode === CONNECTION_MODES.USB && usbConnected) {
      disconnectUSB();
    }
    
    setSelectedMode(mode);
    onModeChange?.(mode);
  };

  // ==================== BLE Functions ====================
  const connectBLE = async () => {
    if (!bleSupported) {
      toast.error('Bluetooth not supported in this browser. Use Chrome or Edge.');
      return;
    }

    setBleConnecting(true);

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'HeartWise' },
          { namePrefix: 'HEARTWISE' }
        ],
        optionalServices: [SERVICE_UUID]
      });

      bleDeviceRef.current = device;
      device.addEventListener('gattserverdisconnected', handleBLEDisconnect);

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);

      // Get characteristics
      const ecgChar = await service.getCharacteristic(ECG_CHAR_UUID);
      const controlChar = await service.getCharacteristic(CONTROL_CHAR_UUID);
      
      ecgCharRef.current = ecgChar;
      controlCharRef.current = controlChar;

      // Try to get device info
      try {
        const infoChar = await service.getCharacteristic(DEVICE_INFO_UUID);
        const infoValue = await infoChar.readValue();
        const infoText = new TextDecoder().decode(infoValue);
        const deviceInfo = JSON.parse(infoText);
        console.log('BLE Device Info:', deviceInfo);
      } catch (e) {
        console.log('Could not read device info');
      }

      // Subscribe to ECG notifications
      await ecgChar.startNotifications();
      ecgChar.addEventListener('characteristicvaluechanged', handleBLEData);

      setBleDevice({ name: device.name, id: device.id });
      setBleConnected(true);
      onBLEConnectionChange?.(true, { name: device.name, id: device.id });
      toast.success(`Connected to ${device.name}`);

    } catch (error) {
      console.error('BLE connection error:', error);
      if (error.name !== 'NotFoundError') {
        toast.error(`BLE connection failed: ${error.message}`);
      }
    } finally {
      setBleConnecting(false);
    }
  };

  const handleBLEDisconnect = () => {
    setBleConnected(false);
    setBleDevice(null);
    bleDeviceRef.current = null;
    ecgCharRef.current = null;
    controlCharRef.current = null;
    onBLEConnectionChange?.(false);
    toast.error('BLE device disconnected');
  };

  const disconnectBLE = () => {
    if (bleDeviceRef.current?.gatt?.connected) {
      bleDeviceRef.current.gatt.disconnect();
    }
    setBleConnected(false);
    setBleDevice(null);
  };

  const handleBLEData = (event) => {
    const value = event.target.value;
    const text = new TextDecoder().decode(value);

    try {
      const rawData = JSON.parse(text);
      console.log('BLE raw data:', text.substring(0, 100));
      
      // Handle compact BLE format: {"sid":"xxx","d":[{"t":123,"v":150,"q":80},...]}
      // Convert to standard format: {"data":[{"timestamp":123,"voltage":1.5,"quality":80},...]}
      let data = rawData;
      
      if (rawData.d && Array.isArray(rawData.d)) {
        // Convert compact BLE format to standard format
        const now = Date.now();
        data = {
          sessionId: rawData.sid,
          data: rawData.d.map((point, index) => ({
            timestamp: point.t,
            voltage: point.v / 10, // BLE sends voltage * 10 as integer
            quality: point.q,
            leadsOff: false,
            displayTime: now - ((rawData.d.length - 1 - index) * 4), // 4ms between samples at 250Hz
          }))
        };
      } else if (data.data && Array.isArray(data.data)) {
        // Standard format - add displayTime
        const now = Date.now();
        data.data = data.data.map((point, index) => ({
          ...point,
          displayTime: now - ((data.data.length - 1 - index) * 4),
        }));
      }
      
      onBLEData?.(data);
    } catch (error) {
      console.error('Failed to parse BLE data:', error, text);
    }
  };

  const sendBLECommand = async (command) => {
    if (!controlCharRef.current) return false;

    try {
      const cmdString = typeof command === 'string' ? command : JSON.stringify(command);
      await controlCharRef.current.writeValue(new TextEncoder().encode(cmdString));
      return true;
    } catch (error) {
      console.error('BLE command failed:', error);
      return false;
    }
  };

  // ==================== USB Serial Functions ====================
  const connectUSB = async () => {
    if (!serialSupported) {
      toast.error('Web Serial not supported. Use Chrome or Edge, or use the USB Bridge script.');
      return;
    }

    try {
      console.log('🔌 [USB] Requesting port...');
      const port = await navigator.serial.requestPort();
      console.log('🔌 [USB] Port selected, opening...');
      await port.open({ baudRate: 115200 });
      console.log('🔌 [USB] Port opened, starting reader...');
      
      serialPortRef.current = port;
      setUsbConnected(true);
      onUSBConnectionChange?.(true);
      toast.success('USB Serial connected');

      // Start reading
      readUSBSerial(port);

    } catch (error) {
      console.error('🔌 [USB] Connection error:', error);
      if (error.name !== 'NotFoundError') {
        toast.error(`USB connection failed: ${error.message}`);
      }
    }
  };

  const readUSBSerial = async (port) => {
    console.log('🔌 [USB] Reader starting...');
    const reader = port.readable.getReader();
    serialReaderRef.current = reader;
    
    let buffer = '';
    const decoder = new TextDecoder();
    let lineCount = 0;

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete JSON lines
        while (buffer.includes('\n')) {
          const [line, rest] = buffer.split('\n', 2);
          buffer = rest || '';

          if (line.trim().startsWith('{')) {
            try {
              const data = JSON.parse(line.trim());
              lineCount++;
              if (lineCount % 10 === 1) {
                console.log('🔌 [USB] Received:', data.type, 'line#' + lineCount);
              }
              onUSBData?.(data);
            } catch (e) {
              console.log('🔌 [USB] Parse error:', line.trim().substring(0, 50));
            }
          }
        }
      }
    } catch (error) {
      if (error.name !== 'NetworkError') {
        console.error('🔌 [USB] Read error:', error);
      }
    } finally {
      console.log('🔌 [USB] Reader ended');
      reader.releaseLock();
    }
  };

  const disconnectUSB = async () => {
    try {
      if (serialReaderRef.current) {
        await serialReaderRef.current.cancel();
        serialReaderRef.current = null;
      }
      if (serialPortRef.current) {
        await serialPortRef.current.close();
        serialPortRef.current = null;
      }
    } catch (e) {
      console.error('USB disconnect error:', e);
    }
    setUsbConnected(false);
    onUSBConnectionChange?.(false);
  };

  const sendUSBCommand = async (command) => {
    if (!serialPortRef.current?.writable) return false;

    try {
      const writer = serialPortRef.current.writable.getWriter();
      const cmdString = typeof command === 'string' ? command : JSON.stringify(command);
      await writer.write(new TextEncoder().encode(cmdString + '\n'));
      writer.releaseLock();
      return true;
    } catch (error) {
      console.error('USB command failed:', error);
      return false;
    }
  };

  // Mode configuration
  const modes = [
    {
      id: CONNECTION_MODES.WIFI,
      name: 'WiFi',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
      description: 'Connect via WiFi network',
      supported: true,
      connected: true, // WiFi is always "connected" through Socket.IO
      color: 'blue'
    },
    {
      id: CONNECTION_MODES.BLE,
      name: 'Bluetooth',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.71 7.71L12 2.29V7c0 .55-.45 1-1 1H9.41l8.3 8.3-1.41 1.41L12 13.41v5.17c0 .89-1.08 1.34-1.71.71L6.59 15.59l1.41-1.41L12 18.17v-5.17l-4.29 4.29c-.63.63-1.71.18-1.71-.71V7c0-.89 1.08-1.34 1.71-.71L12 10.59l4.29-4.29 1.42 1.41z"/>
        </svg>
      ),
      description: bleSupported ? 'Direct Bluetooth connection' : 'Not supported in this browser',
      supported: bleSupported,
      connected: bleConnected,
      color: 'indigo'
    },
    {
      id: CONNECTION_MODES.USB,
      name: 'USB',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18v-6m0 0V6m0 6h6m-6 0H6" />
          <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} />
        </svg>
      ),
      description: serialSupported ? 'USB cable connection' : 'Use USB Bridge script',
      supported: true, // Can always use bridge script
      connected: usbConnected,
      color: 'green'
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">Connection Mode</h4>
        {selectedMode === CONNECTION_MODES.BLE && bleConnected && (
          <span className="flex items-center text-xs text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
            BLE Connected
          </span>
        )}
        {selectedMode === CONNECTION_MODES.USB && usbConnected && (
          <span className="flex items-center text-xs text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
            USB Connected
          </span>
        )}
      </div>

      {/* Mode Selection Tabs */}
      <div className="flex gap-2 mb-3">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleModeChange(mode.id)}
            disabled={disabled || !mode.supported}
            className={`
              flex-1 flex flex-col items-center py-2 px-3 rounded-lg border-2 transition-all
              ${selectedMode === mode.id 
                ? `border-${mode.color}-500 bg-${mode.color}-50 text-${mode.color}-700` 
                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
              }
              ${!mode.supported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            style={selectedMode === mode.id ? {
              borderColor: mode.color === 'blue' ? '#3b82f6' : mode.color === 'indigo' ? '#6366f1' : '#22c55e',
              backgroundColor: mode.color === 'blue' ? '#eff6ff' : mode.color === 'indigo' ? '#eef2ff' : '#f0fdf4'
            } : {}}
          >
            <div className={`mb-1 ${selectedMode === mode.id ? '' : 'text-gray-400'}`}>
              {mode.icon}
            </div>
            <span className="text-xs font-medium">{mode.name}</span>
            {mode.connected && selectedMode === mode.id && (
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1"></span>
            )}
          </button>
        ))}
      </div>

      {/* Mode-specific controls */}
      {selectedMode === CONNECTION_MODES.BLE && (
        <div className="pt-2 border-t border-gray-100">
          {!bleConnected ? (
            <button
              onClick={connectBLE}
              disabled={bleConnecting || !bleSupported}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium flex items-center justify-center disabled:opacity-50"
            >
              {bleConnecting ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scanning...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.71 7.71L12 2.29V7c0 .55-.45 1-1 1H9.41l8.3 8.3z"/>
                  </svg>
                  Connect Bluetooth Device
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center justify-between bg-indigo-50 rounded-lg p-2">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span className="text-sm font-medium text-indigo-900">{bleDevice?.name}</span>
              </div>
              <button
                onClick={disconnectBLE}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Disconnect
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2 text-center">
            Set ESP32 to BLE mode (Mode 1) before connecting
          </p>
        </div>
      )}

      {selectedMode === CONNECTION_MODES.USB && (
        <div className="pt-2 border-t border-gray-100">
          {serialSupported ? (
            !usbConnected ? (
              <button
                onClick={connectUSB}
                className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Connect USB Device
              </button>
            ) : (
              <div className="flex items-center justify-between bg-green-50 rounded-lg p-2">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-sm font-medium text-green-900">USB Connected</span>
                </div>
                <button
                  onClick={disconnectUSB}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Disconnect
                </button>
              </div>
            )
          ) : (
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Web Serial not supported.</strong> Run the USB Bridge script:
              </p>
              <code className="text-xs bg-yellow-100 px-2 py-1 rounded mt-1 block">
                python tools/usb_serial_bridge.py
              </code>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2 text-center">
            Set ESP32 to USB mode (Mode 2) and connect via USB cable
          </p>
        </div>
      )}

      {selectedMode === CONNECTION_MODES.WIFI && (
        <div className="pt-2 border-t border-gray-100">
          <div className="bg-blue-50 rounded-lg p-2 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span className="text-sm text-blue-900">Using WiFi (default)</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            ESP32 connects automatically via WiFi to the server
          </p>
        </div>
      )}
    </div>
  );
};

export default ConnectionModeSelector;

// Export helper functions for external use
export const useBLECommands = () => {
  return {
    startRecording: async (controlChar, sessionId) => {
      if (!controlChar) return false;
      try {
        const cmd = JSON.stringify({ cmd: 'start', sessionId: sessionId || `ble-${Date.now()}` });
        await controlChar.writeValue(new TextEncoder().encode(cmd));
        return true;
      } catch (e) {
        console.error('BLE start command failed:', e);
        return false;
      }
    },
    stopRecording: async (controlChar) => {
      if (!controlChar) return false;
      try {
        const cmd = JSON.stringify({ cmd: 'stop' });
        await controlChar.writeValue(new TextEncoder().encode(cmd));
        return true;
      } catch (e) {
        console.error('BLE stop command failed:', e);
        return false;
      }
    }
  };
};
