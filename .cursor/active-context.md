> **BrainSync Context Pumper** 🧠
> Dynamically loaded for active file: `frontend/src/pages/ECGMonitor.js` (Domain: **Frontend (React/UI)**)

### 📐 Frontend (React/UI) Conventions & Fixes
- **[problem-fix] Fixed null crash in Handle — avoids unnecessary re-renders in React**: -   // Handle USB data received
+   // Handle USB data received - Enhanced for real-time display
-   const handleUSBData = useCallback((data) => {
+   const handleUSBData = useCallback((dataArray) => {
-     // Accept data in multiple formats:
+     // Handle array of samples from USB
-     // 1. { type: 'ecg-data', data: [...] } - standard format
+     if (!Array.isArray(dataArray) || dataArray.length === 0) {
-     // 2. { data: [...] } - simplified format
+       return;
-     // 3. Skip status/info messages
+     }
-     
+ 
-     console.log('📥 USB received:', data.type, data.data?.length || 0);
+     // Convert raw ADC values to voltage if needed
-     
+     const VOLTAGE_REF = 3.3;
-     if (data.type === 'status' || data.type === 'register' || data.type === 'heartbeat' || data.status || data.type === 'device-info') {
+     const ADC_MAX = 4095;
-       console.log('  (status/info, skipping)');
+ 
-       return;
+     const now = Date.now();
-     }
+     const dataWithDisplayTime = dataArray.map((point, index) => {
-     
+       let voltage = point.voltage;
-     // Extract data array from various formats
+       
-     let dataArray = null;
+       // Convert raw ADC to voltage if needed
-     if (data.data && Array.isArray(data.data)) {
+       if (voltage === undefined && point.raw !== undefined) {
-       dataArray = data.data;
+         const rawVoltage = (point.raw / ADC_MAX) * VOLTAGE_REF;
-     } else if (Array.isArray(data)) {
+         voltage = (rawVoltage - (VOLTAGE_REF / 2.0)) * 1000.0;
-       dataArray = data;
+       }
-     }
+ 
-     
+       return {
-     if (dataArray && dataArray.length > 0) {
+         ...point,
-       console.log('  Processing', dataArray.length, 'samples');
+         voltage: voltage ?? 0,
-       const firstPoint = dataArray[0];
+         quality: point.quality ?? 30,
-       const lastPoint = dataArray[dataArray.length - 1];
+         leadsOff: point.leadsOff ?? false,
-       console.log('  First point: V=' +
… [diff truncated]

📌 IDE AST Context: Modified symbols likely include [ECGMonitor, default]
- **[what-changed] what-changed in useUSBECG.js**: File updated (external): frontend/src/hooks/useUSBECG.js

Content summary (148 lines):
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
  const connect = useCallback(async () =
