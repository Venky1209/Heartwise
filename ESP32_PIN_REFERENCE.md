# ESP32 Pin Reference for AD8232 Connection

## 🔌 Updated Wiring (GPIO34 instead of GPIO36)

```
AD8232 Sensor  →  ESP32 Board
─────────────────────────────
OUTPUT         →  GPIO34 (ADC1_CH6) ← UPDATED!
LO-            →  GPIO2
LO+            →  GPIO4
3.3V           →  3.3V
GND            →  GND
```

## 📍 ESP32 DevKit Pin Layout Reference

```
                    ESP32 DevKit
         ┌─────────────────────────────┐
         │                             │
      EN │● ●│ VP (GPIO36) - ADC1_CH0  │
  GPIO36 │● ●│ VN (GPIO39) - ADC1_CH3  │
  GPIO39 │● ●│ GPIO34 - ADC1_CH6  ← USE THIS!
  GPIO34 │● ●│ GPIO35 - ADC1_CH7       │
  GPIO35 │● ●│ GPIO32 - ADC1_CH4       │
  GPIO32 │● ●│ GPIO33 - ADC1_CH5       │
  GPIO33 │● ●│ GPIO25 - DAC1           │
  GPIO25 │● ●│ GPIO26 - DAC2           │
  GPIO26 │● ●│ GPIO27                  │
  GPIO27 │● ●│ GPIO14                  │
  GPIO14 │● ●│ GPIO12                  │
  GPIO12 │● ●│ GND                     │
     GND │● ●│ GPIO13                  │
  GPIO13 │● ●│ GPIO9  (FLASH)          │
   GPIO9 │● ●│ GPIO10 (FLASH)          │
  GPIO10 │● ●│ GPIO11 (FLASH)          │
  GPIO11 │● ●│ GPIO8  (FLASH)          │
   GPIO8 │● ●│ GPIO7  (FLASH)          │
   GPIO7 │● ●│ GPIO6  (FLASH)          │
   GPIO6 │● ●│ GPIO5                   │
   GPIO5 │● ●│ GPIO4  ← LO+ connects here
   GPIO4 │● ●│ GPIO0  (BOOT button)    │
   GPIO0 │● ●│ GPIO2  ← LO- & LED here │
   GPIO2 │● ●│ GPIO15                  │
  GPIO15 │● ●│ 3.3V ← Power AD8232     │
   3.3V  │● ●│ GND  ← Ground AD8232    │
     GND │● ●│ 5V                      │
         │   USB                       │
         └─────────────────────────────┘
```

## ✅ Recommended ADC Pins (in order of preference)

1. **GPIO34** ← **BEST CHOICE** (ADC1_CH6) - Input only, no conflicts
2. **GPIO35** (ADC1_CH7) - Input only, good alternative
3. **GPIO32** (ADC1_CH4) - Can be output too
4. **GPIO33** (ADC1_CH5) - Can be output too
5. ~~GPIO36~~ - VP pin (might not be on all boards)

## 🚫 Pins to AVOID

- **GPIO6-11**: Connected to internal flash (DON'T USE!)
- **GPIO1, GPIO3**: UART TX/RX (used for serial)
- **ADC2 pins (GPIO0, GPIO2, GPIO4, GPIO12-15)**: Don't work when WiFi is active
  - Exception: GPIO2 and GPIO4 are OK for digital I/O (LO+/LO- detection)

## 🔧 Physical Connection Steps

1. **Identify GPIO34 on your board** (use the diagram above)
2. **Connect jumper wires**:
   ```
   AD8232 OUTPUT → GPIO34 (for analog ECG signal)
   AD8232 LO-    → GPIO2  (leads-off detection)
   AD8232 LO+    → GPIO4  (leads-off detection)
   AD8232 3.3V   → 3.3V   (power)
   AD8232 GND    → GND    (ground)
   ```

3. **Double-check connections** - Wrong pins can damage components!

## 📝 If GPIO34 doesn't work, try this order:

### Option A: Change to GPIO35
```arduino
const int ECG_PIN = 35;  // Instead of 34
```

### Option B: Change to GPIO32
```arduino
const int ECG_PIN = 32;  // Instead of 34
```

### Option C: Change to GPIO33
```arduino
const int ECG_PIN = 33;  // Instead of 34
```

Then recompile and upload the firmware.

## 🧪 Quick Test After Connection

1. Connect AD8232 to ESP32 (GPIO34, GPIO2, GPIO4, 3.3V, GND)
2. DO NOT attach electrode pads yet
3. Touch LO+ and LO- pins together → Blue LED should light
4. Release → LED should turn off
5. If LED behavior is correct → connections are good!

## 💡 Troubleshooting

**Problem**: Serial monitor shows no voltage readings
- Check if OUTPUT wire is in GPIO34
- Try alternative pins (GPIO35, GPIO32, GPIO33)

**Problem**: Values always 0 or always 4095
- Check 3.3V and GND connections
- Ensure OUTPUT wire is properly seated

**Problem**: Erratic random values
- Normal without electrodes on body
- Becomes stable ECG waveform once electrodes attached

---

Ready to compile and upload? The updated firmware uses **GPIO34** which should be available on your board! 🎯
