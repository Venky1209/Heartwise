# ECG Pad Attachment Guide

## Physical Setup

### Step 1: Prepare the Skin
- Clean the area with an alcohol wipe
- Allow to dry (15-30 seconds)
- Do NOT use lotion or oils

### Step 2: Attach the Pads

```
                    Head
                     │
          ┌──────────────────────┐
          │                      │
     RA ──┤ RA (Right Arm)      │
     RED  │ Red Pad              │
          │                      │
          │                      │
    Torso │   ┌──────────────┐   │
          │   │              │   │  LA (Left Arm)
          │   │              │   ├── YELLOW Pad
          │   │              │   │
          └───┼──────────────┼───┘
              │              │
              │              │
         ┌────┴──────────────┴────┐
         │      Abdomen           │
         │                        │
    RL ──┤  RL (Right Leg)        │
    BLACK│  Black Pad (Reference) │
         │                        │
         └────────────────────────┘
```

### Correct Positions

| Pad | Color | Location | Why |
|-----|-------|----------|-----|
| **RA** | Red | Right Wrist/Forearm | Detects right arm electrical activity |
| **LA** | Yellow | Left Wrist/Forearm | Detects left arm electrical activity |
| **RL** | Black | Right Inner Leg (just above ankle) | Ground/Reference for signal |

### Good Contact Checklist
- [ ] Skin is clean and dry
- [ ] No hair interference (can shave if needed)
- [ ] Pad pressed firmly for 30+ seconds
- [ ] Pad stays put (no lifting at edges)
- [ ] Skin color slightly changed under pad (indicates good contact)

## Expected Signal Quality

### When Pads Attached Correctly ✅
```
Voltage:      -100 to +200 mV (varies with heartbeat)
leadsOff:     false
Quality:      60-95%
Amplitude:    50-150 mV
Heart Rate:   60-100 BPM (at rest)
```

### Example Real ECG Reading:
```
P wave:     Small bump (~0.1 mV)
QRS complex: Large spike (~1.0 mV) - strongest signal
T wave:     Medium bump (~0.3 mV)
Baseline:   Oscillates around 0 mV
```

### When Pads NOT Attached ❌ (Current State)
```
Voltage:      -1650 mV (flat/constant)
leadsOff:     true
Quality:      0%
Amplitude:    0 mV
Heart Rate:   0 BPM
```

## Troubleshooting

### Problem: `leadsOff: true` but pads ARE attached

**Try:**
1. Check pad adhesion - press corners firmly
2. Check skin is not too dry/sweaty - wipe and reapply pad
3. Ensure good electrode-skin contact
4. Move pad to different spot on limb
5. Check if pad material is damaged/expired

### Problem: Signal noisy/jumping
1. Keep arm relaxed (muscle tension = noise)
2. Avoid talking (neck muscles)
3. Ensure good pad contact
4. Move away from electrical sources (WiFi router, etc.)

### Problem: Graph shows erratic spikes

**Normal causes:**
- Muscle movement nearby
- Poor electrode contact (intermittent)
- Electric noise from surroundings

**Fix:**
- Sit still
- Press pads firmly
- Move farther from electronics
- Try different limb position

## How To Read Your ECG

Once properly connected, you'll see:

```
        P-wave      QRS        T-wave
          │          │           │
      ┌───┴───┐  ┌───┴───┐  ┌───┴───┐
      │ small │  │ SPIKE │  │ medium│
      └───────┘  └───────┘  └───────┘
                │   │
         ┌──────┴───┴──────────┐
      ───┤ baseline around 0 mV │───
         └────────────────────┘
         
    One complete heartbeat cycle above
```

- **P wave**: Atrial depolarization (top chambers contract)
- **QRS complex**: Ventricular depolarization (main pump)
- **T wave**: Ventricular repolarization (recovery)

## Important Notes ⚠️

- ECG pads are **SINGLE USE** - replace after a few days
- Store in cool, dry place
- Do NOT reuse the same area of skin (risk of irritation)
- This is a **hobby ECG** - NOT for medical diagnosis
- For actual medical concerns, see a cardiologist with professional equipment

---

**Current Status: System Ready** ✅
**Next Action: Attach Pads and Start Session** 🏥
