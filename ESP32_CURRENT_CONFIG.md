# ESP32 WiFi Configuration - Quick Reference

## Current Network Settings

**WiFi Network:**
- SSID: `venky`
- Password: `12345678`

**Backend Server:**
- IP Address: `10.172.9.74` (Your Mac)
- Port: `5001`
- WebSocket Path: `/ws/esp32`

**Device Information:**
- Device ID: `HEARTWISE-ESP32-01-050`
- Device Name: `HeartWise-ESP32-01`

## Files Updated

1. `/arduino/HeartWise_ESP32_READY/HeartWise_ESP32_READY.ino`
2. `/arduino/heartwise_ecg_monitor.ino`

## How to Upload to ESP32

### Prerequisites
1. Install Arduino IDE
2. Install ESP32 Board Support:
   - Go to File → Preferences
   - Add to Additional Boards Manager URLs:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to Tools → Board → Boards Manager
   - Search "ESP32" and install "esp32 by Espressif Systems"

3. Install Required Libraries (Tools → Manage Libraries):
   - `WebSockets` by Markus Sattler
   - `ArduinoJson` by Benoit Blanchon

### Upload Steps

1. **Connect ESP32** to your Mac via USB

2. **Open the sketch:**
   ```
   arduino/HeartWise_ESP32_READY/HeartWise_ESP32_READY.ino
   ```

3. **Configure Arduino IDE:**
   - Tools → Board → ESP32 Arduino → ESP32 Dev Module
   - Tools → Port → (select your ESP32 port, usually /dev/cu.usbserial-*)
   - Tools → Upload Speed → 115200

4. **Upload:**
   - Click Upload button (→)
   - Wait for "Done uploading"

5. **Monitor Serial Output:**
   - Tools → Serial Monitor
   - Set baud rate to `115200`
   - You should see:
     ```
     ========================================
     HeartWise ECG Monitor - ESP32
     ========================================
     Connecting to WiFi: venky
     WiFi connected!
     IP address: (ESP32's IP)
     Connecting to server: 10.172.9.74:5001
     WebSocket Connected!
     ```

## Troubleshooting

### ESP32 Won't Connect to WiFi
- Ensure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Check SSID and password are correct
- Move ESP32 closer to router

### Can't Connect to Server
- Verify your Mac's IP hasn't changed: `ipconfig getifaddr en0`
- Ensure backend server is running: `./start-all.sh`
- Check firewall settings on Mac

### Upload Failed
- Make sure correct port is selected
- Try pressing BOOT button on ESP32 during upload
- Check USB cable supports data transfer

## Checking Your Mac's IP Address

Run this command in terminal:
```bash
ipconfig getifaddr en0 || ipconfig getifaddr en1
```

If IP changes, update both Arduino files and re-upload to ESP32.

## Testing the Connection

1. Start all services:
   ```bash
   cd /Users/gugank/New\ Idea/heartwise-ecg
   ./start-all.sh
   ```

2. Upload code to ESP32

3. Open Serial Monitor (115200 baud)

4. Check backend logs:
   ```bash
   tail -f logs/backend.log
   ```
   You should see: "ESP32 device connected"

5. Open frontend:
   ```
   http://localhost:3000
   ```
   Go to "Devices" - ESP32 should show as online

## Hardware Connections

```
AD8232 ECG Sensor → ESP32
==========================
OUTPUT    →  GPIO34 (A0)
LO-       →  GPIO2
LO+       →  GPIO4
3.3V      →  3.3V
GND       →  GND
```

## Next Steps

1. ✅ WiFi credentials updated
2. ✅ Server IP updated
3. ⬜ Upload to ESP32
4. ⬜ Test connection
5. ⬜ Start ECG recording

---

**Last Updated:** November 10, 2025  
**Network:** venky  
**Server IP:** 10.172.9.74
