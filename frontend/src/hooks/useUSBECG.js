import React, { useCallback, useRef, useEffect, useState } from 'react';

/**
 * USB Serial ECG Data Handler
 * Handles Web Serial API connection and provides data to React component
 */
const USBECGHandler = ({ onDataReceived, onConnectionChange, enabled = true }) => {
  const [isConnected, setIsConnected] = useState(false);
  const portRef = useRef(null);
  const readerRef = useRef(null);
  const isReadingRef = useRef(false);

  // Connect to USB device
  const connect = useCallback(async () => {
    try {
      if (!navigator.serial) {
        alert('Web Serial API not supported. Use Chrome/Edge on desktop.');
        return false;
      }

      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });

      portRef.current = port;
      setIsConnected(true);
      onConnectionChange?.(true);

      // Start reading data
      readSerialData(port);
      return true;
    } catch (error) {
      console.error('USB Connection Error:', error);
      if (error.name !== 'NotFoundError') {
        alert(`Connection failed: ${error.message}`);
      }
      return false;
    }
  }, [onConnectionChange]);

  // Read serial data continuously
  const readSerialData = useCallback(async (port) => {
    if (isReadingRef.current) return;
    isReadingRef.current = true;

    const reader = port.readable.getReader();
    readerRef.current = reader;
    const decoder = new TextDecoder();
    let buffer = '';

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

              // Handle different formats
              if (data.type === 'ecg-data' && data.data && Array.isArray(data.data)) {
                // Batched format
                onDataReceived?.(data.data);
              } else if (Array.isArray(data)) {
                // Array format
                onDataReceived?.(data);
              } else if (data.voltage !== undefined || data.raw !== undefined) {
                // Single sample - convert to array
                onDataReceived?.([data]);
              }
            } catch (e) {
              // Silently ignore JSON parse errors
            }
          }
        }
      }
    } catch (error) {
      if (error.name !== 'NetworkError') {
        console.error('Serial Read Error:', error);
      }
    } finally {
      isReadingRef.current = false;
      setIsConnected(false);
      onConnectionChange?.(false);
      reader.releaseLock();
    }
  }, [onDataReceived, onConnectionChange]);

  // Disconnect
  const disconnect = useCallback(async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
    } catch (error) {
      console.error('Disconnect Error:', error);
    }
    setIsConnected(false);
    onConnectionChange?.(false);
    isReadingRef.current = false;
  }, [onConnectionChange]);

  // Send command to ESP32
  const sendCommand = useCallback(async (command) => {
    if (!portRef.current?.writable) return false;
    try {
      const writer = portRef.current.writable.getWriter();
      await writer.write(new TextEncoder().encode(command + '\n'));
      writer.releaseLock();
      return true;
    } catch (error) {
      console.error('Send Command Error:', error);
      return false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isReadingRef.current) {
        disconnect();
      }
    };
  }, [disconnect]);

  // Expose methods via ref
  return {
    connect,
    disconnect,
    sendCommand,
    isConnected,
    port: portRef.current
  };
};

export default USBECGHandler;
