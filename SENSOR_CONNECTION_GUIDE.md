# AD8232 ECG Sensor Connection Guide

## 🔌 Hardware Wiring

### ESP32 to AD8232 Connections:
```
┌─────────────┐              ┌──────────────┐
│   ESP32     │              │   AD8232     │
│             │              │   Sensor     │
├─────────────┤              ├──────────────┤
│ GPIO36 (A0) │◄─────────────│ OUTPUT       │
│ GPIO2       │◄─────────────│ LO-          │
│ GPIO4       │◄─────────────│ LO+          │
│ 3.3V        │─────────────►│ 3.3V         │
│ GND         │─────────────►│ GND          │
└─────────────┘              └──────────────┘
```

## 📍 Electrode Placement

### Standard Lead-I Configuration:
```
        RA (Right Arm) - Red
         ●
        /
       /
      ●─────────────● LA (Left Arm) - Yellow
    RL (Reference)
  Green - Ground
```

### On Human Body:
- **RA (Red)**: Right collarbone area or right upper chest
- **LA (Yellow)**: Left collarbone area or left upper chest
- **RL (Green)**: Right lower abdomen or right hip (ground reference)

## ⚠️ Important Safety Notes

1. **Connection Order**:
   - ✅ Connect AD8232 to ESP32 first
   - ✅ Start the system and verify WebSocket connection
   - ✅ Then attach electrodes to body

2. **Testing Without Body**:
   - If LO+ or LO- pins are touched together, LED will glow (leads-off detection working)
   - For real ECG, electrodes must be on skin

3. **Power Requirements**:
   - AD8232 operates at 3.3V (same as ESP32)
   - Current draw: ~170μA typical
   - Ensure USB provides stable power

4. **Signal Quality**:
   - Clean skin contact is essential
   - Use electrode gel if available
   - Minimize movement during recording
   - Keep away from AC power sources (50/60Hz interference)

## 🧪 Testing Procedure

### Step 1: Hardware Connection
1. Power off ESP32
2. Connect AD8232 sensor using jumper wires
3. Double-check all 5 connections (OUTPUT, LO-, LO+, 3.3V, GND)

### Step 2: System Verification
1. Power on ESP32 (connect USB)
2. Check serial monitor for successful boot
3. Verify WebSocket connection: "✓ WebSocket Connected!"
4. Confirm device registration in backend

### Step 3: Sensor Test (No Electrodes)
1. Touch LO+ and LO- pins together → Blue LED should light up
2. Release → LED should turn off (with electrodes, it would stay off)

### Step 4: Live ECG Recording
1. Attach electrodes to body (RA, LA, RL positions)
2. Open web interface: http://localhost:3001/monitor
3. Select patient and device
4. Click "Start Recording"
5. Watch real-time ECG waveform appear!

## 🔧 Troubleshooting

### Issue: Blue LED always on
- **Cause**: Electrodes not making good skin contact
- **Solution**: Press electrodes firmly, add gel, clean skin

### Issue: Noisy signal (lots of spikes)
- **Cause**: Movement, loose wires, AC interference
- **Solution**: Stay still, check connections, move away from AC power

### Issue: Flat line (no signal)
- **Cause**: Wrong wiring, bad connections
- **Solution**: Verify all 5 wire connections, check ESP32 GPIO pins

### Issue: No data reaching backend
- **Cause**: WebSocket disconnected
- **Solution**: Check serial monitor, verify WiFi connection, restart ESP32

## 📊 Expected Output

### Serial Monitor (when working correctly):
```
✓ WiFi Connected!
✓ WebSocket Connected!
✓ Device registered with backend
▶ Recording Started - Session: abc-123
→ Sent batch: 50 samples
→ Sent batch: 50 samples
✓ Data acknowledged: 50 points
```

### Backend Logs:
```
🔌 ESP32 WebSocket connected: 192.168.0.116
✓ ESP32 Device registered: HEARTWISE-ESP32-01-050
ECG data received: 50 samples
```

### Web Interface:
- Real-time waveform updating 4 times per second
- Timestamp counter advancing
- Green "Recording" indicator

---

## 🎯 System Configuration

- **Sample Rate**: 250 Hz (4ms per sample)
- **Batch Size**: 50 samples per transmission
- **Transmission Rate**: ~5 batches/second
- **Data Format**: JSON with timestamp, voltage, quality score
- **Storage**: PostgreSQL database for AI analysis

## 🏥 Ready to Monitor!

Once connected, your HeartWise system will:
1. ✅ Capture ECG signals at medical-grade 250Hz
2. ✅ Stream data in real-time to web dashboard
3. ✅ Store in AI-ready format for analysis
4. ✅ Display beautiful waveform visualization
5. ✅ Enable historical review and pattern detection

**Happy Monitoring! 💚**
