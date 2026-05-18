# USB Pure Mode - Complete Setup Guide

## CURRENT STATUS: ❌ Pads NOT Attached
```
V = -1650 mV (flat line, no signal)
leadsOff = true (sensor detecting open circuit)
```

**The ESP32 is working perfectly. The issue is the physical electrode pads.**

---

## Step 1: Check Your Pads

Do you have three ECG electrode pads? They look like:
- Small sticker-like pads
- Silver/metallic center (the electrode)
- Adhesive backing
- Usually come in red, yellow, black

**If you DON'T have them:**
- Order "disposable ECG electrode pads" online
- Or get "ECG leads" / "ECG adhesive pads"
- They're cheap (~$10 for 50 pads on Amazon)

---

## Step 2: Prepare Your Skin

### Clean the area:
1. Use a dry cloth to wipe your arm/leg
2. If hairy, lightly shave with a razor (don't nick yourself!)
3. Wait 1 minute for skin to dry completely
4. **NO lotion, oil, or sweat** - this blocks electrical contact

### Three attachment points needed:
```
        Head
         │
    ┌────┼────┐
    │         │
   RA         LA
  (Red)    (Yellow)
    │         │
    │    ○    │  ← Heart (center)
    │         │
    └────┼────┘
         │
        RL (Black) = Right leg, just above ankle
```

---

## Step 3: Attach Pads CORRECTLY

### **Pad 1 - RED (RA - Right Arm):**
1. Peel off backing from red pad
2. Place on inner forearm (inside of wrist), 2-3 inches from wrist bone
3. **Press firmly for 30 seconds** - don't just stick and move
4. Smooth out air bubbles
5. Pad should NOT peel at edges

**Good placement:** Inner forearm, between wrist and elbow, on soft skin
**Bad placement:** Over bone, hairy area, sweaty area

---

### **Pad 2 - YELLOW (LA - Left Arm):**
1. Same as RED pad
2. Place on LEFT inner forearm
3. Mirror position from red pad
4. **Press firmly for 30 seconds**

---

### **Pad 3 - BLACK (RL - Reference):**
1. Place on RIGHT LEG, just above the ankle bone
2. On the inner leg (inside of calf)
3. **Press firmly for 30 seconds**

This is the GROUND/REFERENCE - most critical for signal quality

---

## Step 4: Test Connection

**Run this command to verify pads are connected:**

```bash
cd /Users/gugank/New\ Idea/heartwise-ecg
python3 /tmp/test_usb.py
```

### Expected output when pads ARE attached:
```
✓ Serial port opened
→ Sending START...
← Reading data...

Batch 0: 25 pts, V=-85.5to+125.3mV, LO=False     ← ✅ Varying voltage!
Batch 1: 25 pts, V=-120.1to+95.2mV, LO=False     ← ✅ Different values!
Batch 2: 25 pts, V=-45.3to+180.7mV, LO=False     ← ✅ Real heartbeat!
Batch 3: 25 pts, V=-95.5to+140.2mV, LO=False
Batch 4: 25 pts, V=-110.8to+160.1mV, LO=False

✓ Done
```

### Current output (❌ Pads NOT attached):
```
Batch 2: 25 pts, V=-1650.0to-1650.0mV, LO=False  ← ❌ Stuck at -1650!
Batch 3: 25 pts, V=-1650.0to-1650.0mV, LO=False  ← ❌ All same value!
Batch 4: 25 pts, V=-1650.0to-1650.0mV, LO=False  ← ❌ No variation!
```

---

## Step 5: Once Pads Are Connected

1. Open browser to http://localhost:3000/monitor
2. Look at the top where it says "Current Mode:"
3. **Make sure USB is selected** (not WiFi)
4. Click "Connect USB Device" button
5. Select the serial port (usually `/dev/cu.usbserial-10` or similar)
6. Should show "✅ USB Connected"
7. Click "Start ECG Session" button

---

## Step 6: Watch the Graph

You should see:
- ✅ Green wavy line (not flat!)
- ✅ Line moves up and down with your heartbeat
- ✅ Heart Rate shows a number (not 0)
- ✅ Signal Quality shows percentage (not 0%)
- ✅ Amplitude shows value in mV (not 0.000)

---

## Troubleshooting Pad Connection

### Problem: Still showing -1650mV after pressing pads

**Try:**
1. **Increase pressure** - push MUCH harder, hold for 60 seconds
2. **Check adhesion** - make sure edges aren't lifting
3. **Wet your skin** - lightly dampen the area (helps conductivity)
4. **Different location** - try 1 inch higher/lower on arm
5. **New pads** - old pads lose adhesion, try fresh ones

### Problem: Pads keep falling off

1. Make sure skin is completely DRY before attaching
2. Clean off any old adhesive residue
3. Press for full 60 seconds
4. Can use athletic tape to hold edges if needed

### Problem: Shows varying voltage but still says leadsOff=true

This is unusual. Try:
1. Check if pads are actually making contact (no gaps)
2. Try rubbing the electrode area gently to improve contact
3. Replace with new pads

---

## Verification Checklist

Before starting ECG session, verify:

- [ ] Three pads visible on body (RA, LA, RL)
- [ ] Each pad pressed firmly for 30+ seconds
- [ ] No edges lifting
- [ ] Skin underneath pads is dry
- [ ] No lotion/sweat on skin
- [ ] Ran `python3 /tmp/test_usb.py` and saw **varying voltages** (not -1650)
- [ ] Pads have been on for 2+ minutes (adhesive sets)
- [ ] Browser shows "✅ USB Connected"
- [ ] Current Mode shows "USB"

---

## Expected Real ECG Readings

Once pads are working, you'll see:

```
Voltage: -150 to +200 mV (varies with heartbeat)
leadsOff: false
Quality: 60-95%
Heart Rate: 60-100 BPM (at rest)
```

Graph will show:
```
     P-wave    QRS      T-wave
       │        │         │
    ╱─ ╲    ╱───┴───╲   ╱─ ╲
───┤     ├──┤       ├─┤     ├───
    ╲─ ╱    ╲───┬───╱   ╲─ ╱
                │
          One heartbeat cycle
```

---

**Next Action:**
1. Attach pads properly to your body
2. Run the Python test to verify they're working
3. Then use the browser interface to record

You've got this! 💪
