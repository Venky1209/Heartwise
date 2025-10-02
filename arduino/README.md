# HeartWise ECG Monitor - Arduino Setup Guide

## Hardware Requirements

### Components
- ESP32 Development Board (ESP32-DevKitC or similar)
- AD8232 Single Lead Heart Rate Monitor
- Jumper wires
- Breadboard
- ECG electrodes (3-lead)
- USB cable for programming
- Optional: LiPo battery (3.7V) for portable operation

### Wiring Connections

| AD8232 Pin | ESP32 Pin | Description |
|------------|-----------|-------------|
| OUTPUT     | GPIO36 (A0) | ECG signal output |
| LO-        | GPIO2 (D2)  | Leads-off detection negative |
| LO+        | GPIO4 (D3)  | Leads-off detection positive |
| SDN        | GPIO5 (D4)  | Shutdown (optional) |
| 3.3V       | 3.3V        | Power supply |
| GND        | GND         | Ground |

### ECG Electrode Placement
- **RA (Right Arm)**: Right wrist or below right collarbone
- **LA (Left Arm)**: Left wrist or below left collarbone  
- **RL (Right Leg)**: Right ankle or right side of torso (reference)

## Software Setup

### 1. Install Arduino IDE
Download and install Arduino IDE from [arduino.cc](https://www.arduino.cc/en/software)

### 2. Install ESP32 Board Support
1. Open Arduino IDE
2. Go to File → Preferences
3. Add this URL to "Additional Board Manager URLs":
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
4. Go to Tools → Board → Boards Manager
5. Search for "ESP32" and install "ESP32 by Espressif Systems"

### 3. Install Required Libraries
Go to Tools → Manage Libraries and install:
- **WebSockets** by Markus Sattler
- **ArduinoJson** by Benoît Blanchon

### 4. Configure the Code
1. Open `heartwise_ecg_monitor.ino` in Arduino IDE
2. Update WiFi credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
3. Update server configuration:
   ```cpp
   const char* server_host = "192.168.1.100"; // Your server IP
   const int server_port = 5000;
   ```

### 5. Board Configuration
1. Select **Tools → Board → ESP32 Arduino → ESP32 Dev Module**
2. Select the correct port under **Tools → Port**
3. Set these parameters:
   - Upload Speed: 921600
   - CPU Frequency: 240MHz
   - Flash Mode: QIO
   - Flash Size: 4MB
   - Partition Scheme: Default 4MB

## Usage Instructions

### 1. Upload the Code
1. Connect ESP32 to computer via USB
2. Click Upload button in Arduino IDE
3. Wait for "Done uploading" message

### 2. Serial Monitor Commands
Open Serial Monitor (Tools → Serial Monitor, 115200 baud) and use these commands:
- `status` - Show device status
- `test` - Test ECG reading for 10 seconds
- `calibrate` - Calibrate device baseline
- `restart` - Restart the device

### 3. ECG Monitoring Process
1. Attach ECG electrodes to patient
2. Connect electrodes to AD8232 sensor
3. Power on ESP32 (device will auto-connect to WiFi)
4. Device registers with HeartWise backend
5. Start ECG session from web interface
6. Real-time ECG data streams to the dashboard

## Troubleshooting

### Common Issues

**WiFi Connection Problems:**
- Check SSID and password
- Ensure WiFi network is 2.4GHz (ESP32 doesn't support 5GHz)
- Check signal strength

**No ECG Signal:**
- Verify electrode placement and skin contact
- Check wire connections
- Ensure AD8232 is powered (3.3V)
- Clean electrode contact points

**WebSocket Connection Issues:**
- Verify server IP address and port
- Check if backend server is running
- Ensure firewall allows connection on port 5000

**Poor Signal Quality:**
- Clean electrode contact areas with alcohol
- Replace electrodes if dried out
- Minimize movement during recording
- Keep away from electrical interference

### LED Status Indicators
- **Solid ON**: WiFi and WebSocket connected
- **OFF**: Not connected
- **2 Blinks**: Recording started
- **1 Blink**: Recording stopped
- **3 Blinks**: Setup completed

## Safety Considerations

⚠️ **IMPORTANT SAFETY NOTES:**

1. **Not for Medical Diagnosis**: This device is for educational/research purposes only
2. **Low Voltage Only**: Use only 3.3V power supply
3. **Clean Electrodes**: Use medical-grade electrodes and clean contact areas
4. **Avoid Water**: Keep electronic components dry
5. **Proper Disposal**: Dispose of electrodes properly after use

## Advanced Configuration

### Custom Sample Rates
Modify the `SAMPLE_RATE` constant (default: 250 Hz):
```cpp
const int SAMPLE_RATE = 500; // For higher resolution
```

### Battery Monitoring
Connect LiPo battery positive terminal to GPIO39 through voltage divider:
```
Battery+ ---- 100kΩ ---- GPIO39 ---- 100kΩ ---- GND
```

### Calibration Values
Adjust these constants based on your specific hardware:
```cpp
const float VOLTAGE_REF = 3.3;    // ESP32 reference voltage
const int ADC_RESOLUTION = 4096;  // 12-bit ADC
```

## Performance Specifications

- **Sample Rate**: 250 Hz (configurable up to 1kHz)
- **Resolution**: 12-bit ADC (0.8mV per bit)
- **Voltage Range**: 0-3.3V input
- **ECG Range**: ±5mV (after processing)
- **Leads-off Detection**: Hardware-based
- **Data Transmission**: Real-time via WebSocket
- **Power Consumption**: ~200mA (WiFi active)

## Support

For technical support or questions:
1. Check serial monitor output for error messages
2. Verify all hardware connections
3. Ensure latest firmware version
4. Contact HeartWise support team

---

**Note**: This is a prototype device for educational purposes. Not intended for medical diagnosis or treatment.