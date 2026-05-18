# HeartWise ESP32 WiFi Auto-Configuration Guide

## How It Works (v4.0)

The ESP32 now **automatically handles WiFi and server configuration** — no need to edit code or re-flash when you change networks!

### First Boot Flow
```
Power On → No config found → Creates "HeartWise-Setup" WiFi hotspot
         → Connect from phone/laptop → Open 192.168.4.1
         → Enter WiFi + server IP → Saved to flash → Reboots & connects
```

### Subsequent Boots
```
Power On → Loads saved config → Connects to WiFi → Connects to server ✓
```

### If WiFi Fails
```
Can't connect → Falls back to config portal → Enter new credentials
```

---

## Setup Steps

### 1. Flash the Firmware
Upload `arduino/HeartWise_ESP32_ALL_IN_ONE/HeartWise_ESP32_ALL_IN_ONE.ino` using Arduino IDE.

**Required libraries** (same as before):
- WebSockets by Markus Sattler
- ArduinoJson by Benoit Blanchon
- (WiFi, WebServer, Preferences, DNSServer, BLE — built into ESP32 core)

### 2. First-Time Configuration
1. Power on the ESP32
2. On your phone or laptop, connect to WiFi: **`HeartWise-Setup`** (password: `heartwise`)
3. A config page should auto-open. If not, go to **http://192.168.4.1**
4. Select your WiFi network (auto-scanned) and enter the password
5. Enter your computer's IP address (run `ifconfig` on Mac or `ipconfig` on Windows)
6. Set server port (default `5001`)
7. Click **Save & Connect** — the device reboots and connects automatically

### 3. Find Your Computer's IP
```bash
# Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"
```
Use the IP on the same network as the ESP32 (usually `192.168.x.x`).

---

## Changing Configuration

### Method 1: BOOT Button Reset
Hold the **BOOT button** (GPIO0) while powering on → clears all saved settings → config portal starts.

### Method 2: Serial Commands
Connect via USB and open Serial Monitor (115200 baud):

| Command | Description |
|---|---|
| `CONFIG` | Show current saved settings |
| `SET SSID YourNetwork` | Change WiFi network name |
| `SET PASS YourPassword` | Change WiFi password |
| `SET IP 192.168.1.50` | Change server IP |
| `SET PORT 5001` | Change server port |
| `REBOOT` | Restart with new settings |
| `RESET` | Clear all settings and enter config portal |

**Example: change server IP over serial**
```
SET IP 192.168.1.100
REBOOT
```

### Method 3: Config Portal
If the ESP32 can't connect to the stored WiFi (e.g., different network), it automatically re-enters config portal mode. Just connect to `HeartWise-Setup` again and update settings.

---

## LED Indicators

| Pattern | Meaning |
|---|---|
| 3 quick blinks | Boot complete |
| Slow blink (1s) | Config portal mode — waiting for setup |
| Fast toggle (0.5s) | Recording ECG data |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Can't see `HeartWise-Setup` WiFi | Wait 10 seconds after powering on; hold BOOT button during startup |
| Config page doesn't auto-open | Manually go to `http://192.168.4.1` in your browser |
| WiFi connects but no WebSocket | Check server IP is correct (`CONFIG` in serial), check backend is running |
| Need to change network | Hold BOOT button during startup, or type `RESET` in serial |
