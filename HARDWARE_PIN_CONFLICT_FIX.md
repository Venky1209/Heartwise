# HARDWARE ISSUE FOUND: Pin Conflict

## The Problem

In the Arduino code:
```cpp
const int LO_MINUS_PIN = 2;  // Read: "Leads Off Minus" status
const int LO_PLUS_PIN = 4;   // Read: "Leads Off Plus" status
const int LED_PIN = 2;       // ❌ CONFLICTING PIN!
```

**GPIO 2 is assigned to TWO different functions:**
1. `LO_MINUS_PIN` - Should be READ from AD8232 sensor
2. `LED_PIN` - Should be OUTPUT for LED indicator

When the LED code runs (`digitalWrite(LED_PIN, HIGH/LOW)`), it's **overriding the sensor input**, causing the "leads off" detection to always show true.

## The AD8232 Sensor Pinout

```
AD8232 Module Connections (must match hardware):

AD8232 Pin          ESP32 Pin       Function
─────────────────────────────────────────────
OUTPUT              GPIO 36         ECG signal (analog)
LO- (Leads Off -)   GPIO 2 (WRONG!) Should be GPIO 39 or 32
LO+ (Leads Off +)   GPIO 4          OK
3.3V                3.3V            Power
GND                 GND             Ground
```

## Solution: Fix the Pin Configuration

Change the Arduino code from:

```cpp
const int ECG_PIN = 36;
const int LO_MINUS_PIN = 2;      // ❌ Conflicts with LED
const int LO_PLUS_PIN = 4;
const int LED_PIN = 2;           // ❌ Conflicts with LO_MINUS
```

To:

```cpp
const int ECG_PIN = 36;
const int LO_MINUS_PIN = 39;     // ✅ Change from 2 to 39
const int LO_PLUS_PIN = 4;
const int LED_PIN = 2;           // ✅ Keep for LED (no longer conflicts)
```

OR if GPIO 39 is not available, use:

```cpp
const int ECG_PIN = 36;
const int LO_MINUS_PIN = 32;     // ✅ Alternative: use GPIO 32
const int LO_PLUS_PIN = 4;
const int LED_PIN = 2;           // ✅ Now safe
```

## Physical Wiring Check

**What you should have wired:**

```
ESP32 Dev Board                 AD8232 Module
─────────────────               ─────────────
3.3V ──────────────────────────→ 3.3V (VCC)
GND ───────────────────────────→ GND
GPIO 36 (ADC0) ────────────────→ OUTPUT
GPIO 4 ────────────────────────→ LO+ (Leads Off Plus)
GPIO 39 or 32 ─────────────────→ LO- (Leads Off Minus)
GPIO 2 ────────────────────────→ LED (cathode, with 220Ω resistor)
```

**Do NOT connect:**
- GPIO 2 to both LO- AND LED_PIN
- This creates the pin conflict

## Steps to Fix

### Option 1: Quick Software Fix (If wiring is correct)

Edit: `arduino/HeartWise_ESP32_MULTIMODE/HeartWise_ESP32_MULTIMODE.ino`

Change line 61:
```cpp
const int LO_MINUS_PIN = 2;  // ❌ OLD
```

To:
```cpp
const int LO_MINUS_PIN = 39;  // ✅ NEW
```

Then:
1. Save the file
2. Recompile and upload to ESP32
3. Test with `python3 /tmp/test_usb.py`

### Option 2: Hardware Fix (If wiring is wrong)

1. Disconnect ESP32
2. Find the wire going to GPIO 2 from AD8232 LO-
3. Disconnect it
4. Connect AD8232 LO- to GPIO 39 instead
5. Reconnect ESP32

## After Fix

Run the test again:

```bash
python3 /tmp/test_usb.py
```

Expected output (after fix):
```
✓ Serial port opened
→ Sending START...
← Reading data...

Batch 0: 25 pts, V=-85.5to+120.3mV, LO=False    ← ✅ NOW VARYING!
Batch 1: 25 pts, V=-45.1to+95.2mV, LO=False     ← ✅ REAL ECG SIGNAL!
Batch 2: 25 pts, V=-120.5to+75.3mV, LO=False
Batch 3: 25 pts, V=-95.2to+140.1mV, LO=False
Batch 4: 25 pts, V=-55.3to+105.2mV, LO=False

✓ Done
```

---

## Root Cause Analysis

The `-1650mV` output you're seeing is:

1. AD8232 detects: `LO-` and/or `LO+` are HIGH (open circuit)
2. Arduino code: `if (loMinus == HIGH || loPlus == HIGH) leadsOff = true`
3. When `leadsOff = true`: ESP32 outputs `-1650mV` as the voltage
4. **But the problem is:** GPIO 2 is being WRITTEN to (LED), not READ from
5. So the `digitalRead(LO_MINUS_PIN)` is reading the LED state, not the sensor!

This is why you get `-1650mV` even with pads attached - the lead detection is broken.

---

**Next Action:**
1. Open the Arduino file
2. Change `LO_MINUS_PIN` from 2 to 39
3. Recompile and upload
4. Test again

This should fix it!
