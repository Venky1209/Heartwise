# 📡 HeartWise ESP32 - WiFi Configuration

## ✅ Updated Configuration (October 18, 2025)

### 🌐 WiFi Network Settings
```
WiFi Name (SSID): Dayalan
WiFi Password:    9994238295@D
```

### 🖥️ Server Settings
```
Mac IP Address:   192.168.1.10
Backend Port:     5001
WebSocket Path:   /socket.io/?EIO=4&transport=websocket
```

### 📂 Updated Files
The following Arduino files have been updated with the correct credentials:

1. **`/Users/gugank/New Idea/heartwise-ecg/arduino/heartwise_ecg_monitor.ino`**
   - WiFi SSID: `Dayalan`
   - WiFi Password: `9994238295@D`
   - Server IP: `192.168.1.10`
   - Server Port: `5001`

2. **`/Users/gugank/New Idea/heartwise-ecg/arduino/HeartWise_ESP32_READY.ino`**
   - WiFi SSID: `Dayalan`
   - WiFi Password: `9994238295@D`
   - Server IP: `192.168.1.10`
   - Server Port: `5001`

---

## 🚀 Ready to Upload!

Your ESP32 code is now configured and ready to upload:

### 📋 Pre-Upload Checklist:
- [x] WiFi credentials updated (`Dayalan` / `9994238295@D`)
- [x] Server IP updated (`192.168.1.10`)
- [x] Server port set (`5001`)
- [ ] Backend server is running (`npm start` in backend folder)
- [ ] ESP32 connected via USB
- [ ] Correct COM port selected in Arduino IDE
- [ ] Required libraries installed (WebSockets, ArduinoJson)

### 🔧 Hardware Connections:
```
AD8232 → ESP32
─────────────────
OUTPUT → GPIO34 (ADC input)
LO-    → GPIO2  (leads-off detection)
LO+    → GPIO4  (leads-off detection)
3.3V   → 3.3V   (power)
GND    → GND    (ground)
```

### 💻 Upload Steps:

1. **Start Backend Server:**
   ```bash
   cd /Users/gugank/New\ Idea/heartwise-ecg/backend
   npm start
   ```

2. **Open Arduino IDE:**
   - Open: `/Users/gugank/New Idea/heartwise-ecg/arduino/HeartWise_ESP32_READY.ino`

3. **Select Board & Port:**
   - Board: `ESP32 Dev Module`
   - Port: `/dev/cu.SLAB_USBtoUART` (or similar)
   - Upload Speed: `115200`

4. **Upload Code:**
   - Click Upload button (→)
   - Wait for "Done uploading"

5. **Monitor Serial Output:**
   - Open Serial Monitor (Ctrl+Shift+M)
   - Baud Rate: `115200`
   - Watch for connection messages

### 📊 Expected Serial Output:
```
=== HeartWise ECG Monitor Starting ===
Connecting to WiFi: Dayalan
WiFi connected!
IP Address: 192.168.1.xxx
Connecting to server: 192.168.1.10:5001
WebSocket connected!
Device registered successfully
Recording session started
Sending ECG data...
```

---

## 🔍 Troubleshooting:

### If WiFi won't connect:
1. **Check WiFi name** - Make sure it's exactly `Dayalan` (case-sensitive)
2. **Check password** - Verify `9994238295@D` is correct
3. **Check 2.4GHz** - ESP32 only works with 2.4GHz WiFi (not 5GHz)
4. **Router distance** - Move ESP32 closer to the router

### If server won't connect:
1. **Verify IP address:**
   ```bash
   ipconfig getifaddr en0
   # Should show: 192.168.1.10
   ```

2. **Check backend is running:**
   ```bash
   curl http://192.168.1.10:5001/health
   # Should return: {"status":"ok"}
   ```

3. **Check firewall:**
   ```bash
   # Allow port 5001 in macOS firewall
   ```

### If data isn't flowing:
1. **Check electrodes** - Ensure good skin contact
2. **Check wiring** - Verify all 5 connections
3. **Check Serial Monitor** - Look for error messages
4. **Restart everything** - Backend → ESP32 → Browser

---

## 📱 Test the System:

1. **Upload code to ESP32**
2. **Open Serial Monitor** - Verify WiFi & server connection
3. **Open browser** - Go to `http://localhost:3000`
4. **Navigate to ECG Monitor** page
5. **Start recording session**
6. **Attach ECG electrodes** to your chest
7. **Watch real-time ECG waveform**

---

## 🔄 If IP Address Changes:

Your Mac's IP might change when you reconnect to WiFi. To check and update:

```bash
# 1. Get current IP
ipconfig getifaddr en0

# 2. If IP changed, update Arduino code:
# Edit line 34 in HeartWise_ESP32_READY.ino
const char* SERVER_IP = "NEW_IP_HERE";

# 3. Re-upload to ESP32
```

---

## 💾 Backup Info:

**Previous Configuration:**
- Old WiFi: `ACT103708193870_5g`
- Old Password: `96836853`  
- Old IP: `192.168.0.108`

**Current Configuration:**
- WiFi: `Dayalan`
- Password: `9994238295@D`
- IP: `192.168.1.10`

---

## 📞 Quick Commands:

**Get current IP:**
```bash
ipconfig getifaddr en0
```

**Test backend server:**
```bash
curl http://192.168.1.10:5001/health
```

**Start backend:**
```bash
cd /Users/gugank/New\ Idea/heartwise-ecg/backend && npm start
```

**View backend logs:**
```bash
tail -f /Users/gugank/New\ Idea/heartwise-ecg/logs/backend.log
```

---

**✅ Configuration Complete! Your ESP32 is ready to connect and stream ECG data!** 🎉
