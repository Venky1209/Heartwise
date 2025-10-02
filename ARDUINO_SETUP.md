# 🔧 HeartWise ECG - Arduino/ESP32 Setup Guide

## ✅ **Status: Driver Installed Successfully!**

CP2102 VCP Driver has been installed. You can now proceed with ESP32 setup.

---

## 📋 **Step-by-Step Setup**

### **Step 1: Restart Your Mac** ⚠️ **REQUIRED**
```bash
# The USB driver requires a system restart to work
# Please restart your Mac now before proceeding
```

### **Step 2: Verify ESP32 Connection**
After restart, connect your ESP32 and run:
```bash
ls -la /dev/cu.*
```

You should see something like:
```
/dev/cu.SLAB_USBtoUART
```

### **Step 3: Configure Arduino Code**

Open the file: `/Users/gugank/New Idea/heartwise-ecg/arduino/heartwise_ecg_monitor.ino`

**Update these lines (around line 25-30):**

```cpp
// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";           // ← Replace with your WiFi name
const char* password = "YOUR_WIFI_PASSWORD";    // ← Replace with your WiFi password

// Server Configuration
const char* server_host = "192.168.0.108";     // ← Your Mac's IP (already correct!)
const int server_port = 5000;                   // ← Backend port (already correct!)
```

**Example:**
```cpp
const char* ssid = "MyHomeWiFi";
const char* password = "mypassword123";
const char* server_host = "192.168.0.108";  // Already set to your Mac's IP
```

---

## 🔌 **Hardware Wiring**

### **AD8232 → ESP32 Connections:**

| AD8232 Pin | → | ESP32 Pin | Description |
|------------|---|-----------|-------------|
| OUTPUT     | → | GPIO36 (A0) | ECG analog signal |
| LO-        | → | GPIO2 (D2) | Leads-off detection - |
| LO+        | → | GPIO4 (D3) | Leads-off detection + |
| SDN        | → | GPIO5 (D4) | Shutdown (optional) |
| 3.3V       | → | 3.3V | Power supply |
| GND        | → | GND | Ground |

### **ECG Electrodes Placement:**
- **RA (Right Arm)**: Right side of chest below collarbone
- **LA (Left Arm)**: Left side of chest below collarbone  
- **RL (Right Leg/Ground)**: Lower right abdomen or right hip

---

## 📤 **Upload Code to ESP32**

### **1. Open Arduino IDE**
- Download from: https://www.arduino.cc/en/software
- Or use existing Arduino IDE 2.3.6 (visible in your dock)

### **2. Install ESP32 Board Support** (if not done)
1. Go to: **Arduino IDE → Settings (⌘,)**
2. In "Additional boards manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to: **Tools → Board → Boards Manager**
4. Search for "esp32" and install **"esp32 by Espressif Systems"**

### **3. Install Required Libraries**
1. Go to: **Tools → Manage Libraries** (⌘+⇧+I)
2. Search and install:
   - `WebSockets` by Markus Sattler
   - `ArduinoJson` by Benoit Blanchon (v6.x)

### **4. Configure Board Settings**
- **Board**: "ESP32 Dev Module" or your specific ESP32 board
- **Upload Speed**: 115200
- **Flash Frequency**: 80MHz
- **Port**: `/dev/cu.SLAB_USBtoUART` (or similar)

### **5. Upload**
1. Click **Verify** (✓) to compile
2. Click **Upload** (→) to flash to ESP32
3. Open **Serial Monitor** (Tools → Serial Monitor) to see debug output
4. Set baud rate to **115200**

---

## 🚀 **Start the HeartWise System**

### **Terminal 1 - Backend Server:**
```bash
cd "/Users/gugank/New Idea/heartwise-ecg/backend"
npm run dev
```

You should see:
```
🏥 HeartWise Backend Server running on port 5000
📊 Socket.IO enabled for real-time ECG streaming
Successfully connected to PostgreSQL database
```

### **Terminal 2 - Frontend (Already Running!):**
```bash
# Frontend is already running on http://localhost:3001
# If not, run:
cd "/Users/gugank/New Idea/heartwise-ecg/frontend"
npm start
```

### **Terminal 3 - Monitor ESP32 Serial Output:**
Open Arduino IDE Serial Monitor or run:
```bash
screen /dev/cu.SLAB_USBtoUART 115200
```

---

## 🔍 **Verification Checklist**

- [ ] Driver installed (CP2102 VCP Driver) ✅
- [ ] Mac restarted after driver installation
- [ ] ESP32 connected and detected (`/dev/cu.SLAB_USBtoUART` visible)
- [ ] Arduino code updated with WiFi credentials
- [ ] Server IP set to `192.168.0.108`
- [ ] ESP32 board and libraries installed in Arduino IDE
- [ ] Code uploaded successfully to ESP32
- [ ] Backend server running on port 5000
- [ ] Frontend running on http://localhost:3001
- [ ] AD8232 sensor connected to ESP32
- [ ] ECG electrodes attached to body

---

## 📊 **Expected Serial Monitor Output**

When working correctly, you should see:
```
HeartWise ECG Monitor Starting...
Connecting to WiFi: YourWiFiName
WiFi connected! IP: 192.168.0.xxx
Connecting to WebSocket server...
WebSocket connected!
Device registered: ESP32_XXXXXX
Streaming ECG data...
```

---

## 🆘 **Troubleshooting**

### **ESP32 Not Detected:**
- Ensure USB cable supports data transfer (not charge-only)
- Try different USB ports
- Verify driver installed: System Preferences → Security & Privacy → Allow Silicon Labs driver
- Restart Mac if just installed driver

### **WiFi Connection Failed:**
- Double-check WiFi SSID and password (case-sensitive)
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Check if WiFi network is available

### **WebSocket Connection Failed:**
- Ensure backend server is running on port 5000
- Verify server IP address is correct (192.168.0.108)
- Check firewall settings (allow port 5000)
- Ensure Mac and ESP32 are on the same network

### **No ECG Signal:**
- Check all wiring connections
- Ensure electrodes are properly attached to skin
- Clean skin with alcohol wipe before attaching electrodes
- Check AD8232 power LED

---

## 🎯 **Quick Start (After Initial Setup)**

```bash
# Start everything:

# Terminal 1 - Backend
cd "/Users/gugank/New Idea/heartwise-ecg/backend" && npm run dev

# Terminal 2 - Frontend (if not running)
cd "/Users/gugank/New Idea/heartwise-ecg/frontend" && npm start

# Terminal 3 - Monitor ESP32
screen /dev/cu.SLAB_USBtoUART 115200

# Then power on ESP32 and open browser to:
# http://localhost:3001
```

---

## 📞 **System URLs**

- **Frontend Dashboard**: http://localhost:3001
- **Backend API**: http://localhost:5000
- **WebSocket**: ws://192.168.0.108:5000
- **Database**: PostgreSQL at localhost:5432 (heartwise_ecg)

---

**🎉 You're almost ready! Just restart your Mac, connect the ESP32, and follow the steps above!**
