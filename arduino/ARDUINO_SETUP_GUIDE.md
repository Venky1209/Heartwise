# 🔧 HeartWise ESP32 Arduino Setup Guide

## 📦 What You Need

### Hardware:
- ✅ ESP32 Development Board
- ✅ AD8232 ECG Sensor Module
- ✅ 3 ECG Electrodes (sticky pads)
- ✅ Jumper wires
- ✅ USB cable (data-capable, not charge-only)

### Software:
- ✅ Arduino IDE (Download: https://www.arduino.cc/en/software)
- ✅ CP2102 USB Driver (Already installed! ✓)

---

## 🔌 Step 1: Hardware Wiring

Connect AD8232 to ESP32:

```
AD8232 Pin    →    ESP32 Pin
─────────────────────────────
OUTPUT        →    GPIO36 (A0)
LO-           →    GPIO2
LO+           →    GPIO4
3.3V          →    3.3V
GND           →    GND
```

**ECG Electrode Placement on Body:**
- **RA (Right Arm)**: Right side of chest, below collarbone
- **LA (Left Arm)**: Left side of chest, below collarbone  
- **RL (Right Leg)**: Right lower abdomen (ground/reference)

---

## 💻 Step 2: Arduino IDE Setup

### Install ESP32 Board Support:

1. Open Arduino IDE
2. Go to: **File → Preferences**
3. In "Additional Board Manager URLs", paste:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click **OK**
5. Go to: **Tools → Board → Boards Manager**
6. Search for **"ESP32"**
7. Install **"ESP32 by Espressif Systems"**

### Install Required Libraries:

1. Go to: **Sketch → Include Library → Manage Libraries**
2. Install these two libraries:
   - **WebSockets** by Markus Sattler (version 2.3.6 or later)
   - **ArduinoJson** by Benoit Blanchon (version 6.x)

---

## ⚙️ Step 3: Configure the Code

Open the file: `HeartWise_ESP32_READY.ino`

**Update these lines (30-31):**
```cpp
const char* WIFI_SSID = "YOUR_WIFI_NAME";           // ← Change this!
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";   // ← Change this!
```

**Server IP is already set:**
```cpp
const char* SERVER_IP = "192.168.0.108";  // ✓ Your Mac's IP (correct!)
```

---

## 📤 Step 4: Upload to ESP32

### IMPORTANT: Restart Your Mac First!
The CP2102 driver needs a restart to work.

### After Restart:

1. **Connect ESP32** to Mac via USB
2. **Open Arduino IDE**
3. **Open** the file: `HeartWise_ESP32_READY.ino`
4. **Select Board**: 
   - Go to: **Tools → Board → ESP32 Arduino → ESP32 Dev Module**
5. **Select Port**:
   - Go to: **Tools → Port**
   - Select: `/dev/cu.SLAB_USBtoUART` or `/dev/cu.usbserial-XXXX`
   - (If no port appears, the driver needs restart or cable is charge-only)
6. **Click Upload** button (→ arrow icon)

### During Upload:
- Some ESP32 boards require you to **hold the BOOT button** during upload
- If upload fails, try holding BOOT button and press RESET, then upload again

---

## 🔍 Step 5: Test & Verify

### Monitor Serial Output:

1. After upload, open: **Tools → Serial Monitor**
2. Set baud rate to: **115200**
3. You should see:
   ```
   ╔════════════════════════════════════════╗
   ║   HeartWise ECG Monitor - ESP32        ║
   ║   Hardware: ESP32 + AD8232 Sensor      ║
   ╚════════════════════════════════════════╝
   
   Device ID: HeartWise-ESP32-01-XXXXXX
   Connecting to WiFi: YourWiFiName
   ✓ WiFi Connected!
   IP Address: 192.168.x.x
   ✓ WebSocket Connected!
   ```

### Test ECG Reading:

1. Attach 3 electrodes to your body (as shown in wiring section)
2. Connect electrode cables to AD8232:
   - Red cable → RA
   - Yellow cable → LA
   - Green cable → RL
3. Serial monitor should show:
   ```
   ECG: 0.45 mV | Leads: ON | Quality: 85%
   ```

---

## 🚀 Step 6: Start HeartWise System

### Terminal 1 - Backend:
```bash
cd "/Users/gugank/New Idea/heartwise-ecg/backend"
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd "/Users/gugank/New Idea/heartwise-ecg/frontend"
npm start
```

### Access Application:
- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:5000

---

## 🔧 Troubleshooting

### ESP32 Not Detected:
- ✅ Restart Mac (driver needs restart)
- ✅ Use data USB cable (not charge-only)
- ✅ Try different USB port
- ✅ Check if `/dev/cu.SLAB_USBtoUART` appears: `ls /dev/cu.*`

### Upload Fails:
- Hold **BOOT** button during upload
- Press **RESET** button before upload
- Check correct board and port selected
- Reduce upload speed: **Tools → Upload Speed → 115200**

### WiFi Not Connecting:
- Check WiFi credentials (case-sensitive)
- Make sure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Check WiFi signal strength

### WebSocket Not Connecting:
- Make sure backend server is running first
- Verify server IP address: `ipconfig getifaddr en0`
- Check firewall isn't blocking port 5000
- Both devices must be on same WiFi network

### No ECG Signal:
- Check electrode placement and adhesion
- Verify wiring connections
- Check LO+ and LO- readings in serial monitor
- Try new electrodes if old ones dry out

---

## 📊 LED Indicators

- **Blinking during WiFi connect**: Connecting to WiFi
- **Solid ON**: Connected and ready
- **Fast blinks (2x)**: Recording started
- **Slow blink (1x)**: Recording stopped
- **Triple blink**: Setup complete

---

## 🎯 Next Steps

1. ✅ Upload code to ESP32
2. ✅ Connect electrodes to body
3. ✅ Start backend server
4. ✅ Start frontend application
5. ✅ Go to http://localhost:3001
6. ✅ Navigate to "ECG Monitor"
7. ✅ Start recording session
8. ✅ Watch live ECG on screen!

---

## 📝 Notes

- **Sampling Rate**: 250 Hz (medical grade)
- **Data sent in batches**: 25 samples at a time
- **Heartbeat every**: 30 seconds
- **Quality scoring**: Automatic signal quality assessment
- **Leads-off detection**: Automatic alert if electrodes disconnected

---

## 🆘 Need Help?

Check the serial monitor output - it shows detailed status messages:
```bash
Tools → Serial Monitor (115200 baud)
```

---

**Your Mac IP**: `192.168.0.108` (already configured! ✅)
**Server Port**: `5000`
**WiFi**: Update lines 30-31 in the code

Happy ECG Monitoring! 💓
