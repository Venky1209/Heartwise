# ECG Not Showing - Comprehensive Diagnosis Checklist

## Step 1: Verify Hardware Connection (Physical)

- [ ] ESP32 is powered ON (check for LED blinking)
- [ ] USB cable is connected to computer
- [ ] Three ECG pads attached to body:
  - [ ] **Red pad** on right wrist/arm (RA)
  - [ ] **Yellow pad** on left wrist/arm (LA)
  - [ ] **Black pad** on right leg above ankle (RL reference)
- [ ] Pads pressed firmly for 30+ seconds each
- [ ] Pads are not lifting at edges

## Step 2: Verify Firmware Mode

**The ESP32 needs to be in USB Serial mode (Mode 2)**

How to check/set:
1. Disconnect USB cable
2. Hold the BOOT button on ESP32
3. Connect USB cable (while still holding BOOT)
4. Release BOOT button after 3 seconds
5. The LED should blink 3 times (Mode 2 = USB)

**Expected behavior:**
- LED blinks 3 times rapidly when you attach USB = ✅ USB Mode (MODE 2)
- LED blinks 1 time = WiFi Mode (MODE 0) - WRONG
- LED blinks 2 times = BLE Mode (MODE 1) - WRONG

## Step 3: Verify Browser Connection

### Open Browser DevTools:
- **Mac:** Cmd + Option + I
- **Windows:** F12 or Ctrl + Shift + I

### Go to Console Tab

Watch for these logs after you click "Connect USB Device":

✅ **Should see:**
```
🔌 [USB] Requesting port...
🔌 [USB] Port selected, opening...
🔌 [USB] Port opened, starting reader...
🔌 [USB] Reader starting...
🔌 [USB] Received: device-info line#1
```

❌ **If you see this instead:**
```
USB connection error: NotFoundError: No port selected.
```
→ You clicked Cancel on the port selector. Try again and SELECT your port.

❌ **If you see this:**
```
SerialPort is not defined
```
→ You're using Safari or Firefox. **Use Chrome, Edge, or Chromium only.**

## Step 4: Check Data is Arriving

After connecting USB, look for:

✅ **Good sign:**
```
📥 USB received: ecg-data 25
  Processing 25 samples
  First point: V=-50.2 mV, Q=85, LO=false
  Last point: V=+25.8 mV, Q=82, LO=false
  Data points mapped with displayTime:
    firstTime: 14:32:45
    lastTime: 14:32:45
  Total bleData now: 125 points
```

This shows:
- ✅ Data IS arriving
- ✅ `leadsOff: false` (pads ARE connected!)
- ✅ Voltage varies (real ECG signal!)
- ✅ Being accumulated in `bleData` state

❌ **Bad sign (old data from before pads attached):**
```
📥 USB received: ecg-data 25
  Processing 25 samples
  First point: V=-1650.0 mV, Q=0, LO=true
  Last point: V=-1650.0 mV, Q=0, LO=true
```

This shows:
- ❌ `leadsOff: true` (pads NOT detected!)
- ❌ Voltage stuck at -1650 (flat line)
- ❌ Pads are not touching skin or not attached properly

**Solution:** 
- Clean pads with alcohol wipe
- Press them firmly on skin again
- Wait 30 seconds
- Click "Start ECG Session" to restart recording

## Step 5: Verify Chart is Getting Data

In console, watch for these logs from RealTimeECGChart:

✅ **Should see:**
```
🎨 Chart update triggered, data length: 75
  Latest time: 14:32:47
  Filtered: 73 of 75 points
    Voltages range: -150 to 120
```

This shows:
- ✅ Chart is receiving 75 data points
- ✅ Voltages are varying (between -150 and +120 mV)
- ✅ Data is being plotted

❌ **Bad sign:**
```
🎨 Chart update triggered, data length: 0
```

This means no data reached the chart. Check Step 4 above.

## Step 6: Visual Confirmation

### Look at the Graph

✅ **You should see:**
- Green wavy line (not flat!)
- Line moves up and down showing heartbeat
- X-axis shows time (14:30-14:35 etc)
- Y-axis shows voltage (-1.5 to +1.5 mV)

❌ **If you see a flat line at the bottom:**
- This is the `-1.65mV` leads-off state
- Pads are NOT properly connected
- Go back to Step 1

❌ **If you see NO line at all:**
- Data is not reaching the chart
- Check Steps 2-5 above

### Look at the Stats

✅ **You should see:**
- Heart Rate: **60-100 BPM** (or other value, not 0)
- Signal Quality: **60-95%** (not 0%)
- Amplitude: **50-150 mV** (not 0.000)
- Data Points: **growing number**

❌ **If all show zeros:**
- `leadsOff: true` is still active
- Pads need better skin contact
- Wait 30 seconds after attaching
- Try different spot on arm/leg

## Step 7: If Still Not Working

### Check 1: Is ESP32 actually running?
```bash
# On Mac/Linux, run this in terminal:
ls -la /dev/cu.usbserial*
```

If no output or error, the USB cable might not be plugged in or the ESP32 isn't recognized.

### Check 2: Try a different USB port
Unplug and try a different USB port on your computer.

### Check 3: Restart Everything

```bash
# Stop the application:
Control + C (in terminal)

# Unplug ESP32

# Wait 5 seconds

# Plug ESP32 back in

# Start fresh:
./start-all.sh
```

### Check 4: Check ESP32 Serial Monitor

If you have Arduino IDE:
1. Connect ESP32
2. Open Tools → Serial Monitor
3. Set baud rate to 115200
4. Manually send: `START`
5. Should see JSON data appearing
6. If you see `-1650mV` → pads not attached
7. If you see varying voltages → pads are good!

## Emergency Debug: Direct Serial Read

If nothing works, test the hardware directly:

```bash
cd /Users/gugank/New\ Idea/heartwise-ecg

python3 read_serial_timed.py
```

This will:
1. Connect to ESP32 directly
2. Send START command
3. Print raw sensor data for 10 seconds
4. Show you exactly what the hardware is sending

Expected output:
```
✓ Connected
→ START sent

Batch 0: V=-1650.0mV, Q=0, LO=true        ← Pads not attached
Batch 1: V=-85.3mV, Q=75, LO=false        ← Pads attached! Working!
Batch 2: V=+45.2mV, Q=82, LO=false
```

---

## Still Stuck?

**Take a screenshot of:**
1. Browser console (F12 → Console tab)
2. The graph area
3. The Connection Mode selector showing "USB Connected"

**Then tell me:**
1. What mode is selected? (WiFi/BLE/USB)
2. What voltage is showing in the console?
3. Is `leadsOff: true` or `false`?
4. Does the green line appear on the graph?

This will help me identify the exact issue!
