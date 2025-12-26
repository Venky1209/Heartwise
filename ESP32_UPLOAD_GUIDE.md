# ESP32 Upload Status & Instructions

## ✅ What's Been Done

1. **WiFi Credentials Updated:**
   - SSID: `venky`
   - Password: `12345678`

2. **Server IP Updated:**
   - IP Address: `10.172.9.74` (your Mac)
   - Port: `5001`

3. **Files Updated:**
   - `arduino/HeartWise_ESP32_READY/HeartWise_ESP32_READY.ino`
   - `arduino/heartwise_ecg_monitor.ino`

4. **Code Compiled Successfully:**
   - ✅ Sketch uses 1,115,479 bytes (85%) of program storage
   - ✅ No compilation errors

## ⚠️  Upload Issue

The ESP32 connects but fails during the flash writing process. This is a common hardware/timing issue.

## 🔧 Solutions to Try

### Method 1: Arduino IDE (RECOMMENDED)

1. **Open Arduino IDE**

2. **Install ESP32 Board:**
   - File → Preferences
   - Additional Boards Manager URLs:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Tools → Board → Boards Manager
   - Search "ESP32" → Install "esp32 by Espressif Systems"

3. **Install Libraries:**
   - Tools → Manage Libraries
   - Install: `WebSockets` by Markus Sattler
   - Install: `ArduinoJson` by Benoit Blanchon

4. **Open Sketch:**
   ```
   /Users/gugank/New Idea/heartwise-ecg/arduino/HeartWise_ESP32_READY/HeartWise_ESP32_READY.ino
   ```

5. **Configure:**
   - Tools → Board → ESP32 Arduino → **ESP32 Dev Module**
   - Tools → Port → **/dev/cu.usbserial-10**
   - Tools → Upload Speed → **115200**

6. **Upload:**
   - Click Upload button (→) or Ctrl+U
   - **IMPORTANT**: When you see "Connecting..." in the console:
     - Hold BOOT button
     - Press RESET button once
     - Release BOOT button
   - Wait for "Done uploading"

### Method 2: Try Different USB Cable

- Some USB cables are charging-only
- Use a data-capable USB cable
- Try a different USB port on your Mac

### Method 3: Manual esptool with Slower Baud

```bash
cd /Users/gugank/New\ Idea/heartwise-ecg/arduino/HeartWise_ESP32_READY

# Put ESP32 in bootloader mode manually:
# 1. Hold BOOT button
# 2. Press RESET button
# 3. Release RESET
# 4. Release BOOT after 1 second

# Then run:
python3 -m esptool --chip esp32 --port /dev/cu.usbserial-10 --baud 460800 \
  write_flash -z 0x1000 build/esp32.esp32.esp32/HeartWise_ESP32_READY.ino.bootloader.bin \
  0x8000 build/esp32.esp32.esp32/HeartWise_ESP32_READY.ino.partitions.bin \
  0xe000 ~/.arduino15/packages/esp32/hardware/esp32/*/tools/partitions/boot_app0.bin \
  0x10000 build/esp32.esp32.esp32/HeartWise_ESP32_READY.ino.bin
```

### Method 4: PlatformIO (Alternative)

If you have VS Code with PlatformIO extension:

1. Open folder: `/Users/gugank/New Idea/heartwise-ecg/arduino/HeartWise_ESP32_READY`
2. Create `platformio.ini`:
```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
upload_speed = 460800
```
3. Click Upload button in PlatformIO

## 📊 Verification After Upload

Once upload is successful, you should see in Serial Monitor (115200 baud):

```
========================================
HeartWise ECG Monitor - ESP32
========================================
Connecting to WiFi: venky
.....
WiFi connected!
IP address: (ESP32's IP)

Connecting to server: 10.172.9.74:5001
WebSocket Connected!
Device registered successfully
Ready to start ECG recording
```

## 🧪 Test Connection

1. **Start HeartWise backend:**
   ```bash
   cd /Users/gugank/New\ Idea/heartwise-ecg
   ./start-all.sh
   ```

2. **Check backend logs:**
   ```bash
   tail -f logs/backend.log
   ```
   Should show: "ESP32 device connected"

3. **Open frontend:**
   ```
   http://localhost:3000
   ```
   Go to "Devices" → ESP32 should be online

## 🔍 Troubleshooting

### ESP32 won't enter bootloader mode:
- Try holding BOOT for full 3 seconds before releasing
- Try different timing: Hold BOOT → Press RESET → Wait 1s → Release BOOT
- Some ESP32 boards have EN button instead of RESET

### Still failing:
- Check if ESP32 has enough power (try external 5V power supply)
- Disconnect any peripherals from ESP32 (including ECG sensor)
- Try on a different computer if available

### Serial Monitor shows gibberish:
- Wrong baud rate (should be 115200)
- Wrong board selected
- Corrupted upload - try uploading again

## 📝 Current Configuration

```cpp
WIFI_SSID = "venky"
WIFI_PASSWORD = "12345678"
SERVER_IP = "10.172.9.74"
SERVER_PORT = 5001
DEVICE_ID = "HEARTWISE-ESP32-01-050"
```

## ✅ Next Steps After Successful Upload

1. Verify WiFi connection in Serial Monitor
2. Verify WebSocket connection to backend
3. Test ECG recording from frontend
4. Check real-time data streaming

---

**Need Help?**
- Check Serial Monitor for error messages
- Verify your Mac's IP hasn't changed: `ipconfig getifaddr en0`
- Ensure backend is running on port 5001
- Check firewall settings on Mac
