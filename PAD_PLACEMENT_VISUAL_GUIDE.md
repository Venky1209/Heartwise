# ECG Pad Placement - Visual Guide

## Your Body Position During ECG

```
You should be sitting comfortably:

      HEAD
       │
    ┌──┴──┐
    │     │
    │  ○  │ ← Facing you
    │     │
   /│\   /│\
  / │ \ / │ \
    │   │
    ┴ ┴ ┴ ┴
```

## Pad Placement - TOP VIEW

```
         RIGHT ARM          LEFT ARM
         
          ────────          ────────
          │ RA  │           │ LA  │
          │ RED │           │YLW  │
          ────────          ────────
          (wrist              (wrist
           area)              area)


         REFERENCE
         
          ────────
          │ RL   │
          │BLACK │
          ────────
          (Right leg
           above ankle)
```

## Step-by-Step Placement

### 1. RIGHT ARM (RED PAD) - "RA"

```
          Your arm extended outward
                  │
                ┌─┴─┐
              ╱     ╲
      Elbow ═╪═     ═╪═ Wrist
              ╲     ╱
                └─┬─┘
                  │
                  
    Place RED pad HERE (forearm, inner side):
    
    ┌─────────────┬──────────────┐
    │  Inner      │ ⭕ RED PAD    │
    │ forearm     │              │
    │ (smooth     ├──────────────┤
    │  skin)      │ About 2-3    │
    │             │ inches from  │
    │             │ wrist bone   │
    └─────────────┴──────────────┘
    
    Position: Along the underside of forearm
    Not over: Bone, hair, veins, or dry skin
```

### 2. LEFT ARM (YELLOW PAD) - "LA"

```
    Exact same as RED pad, but on LEFT arm:
    
    ┌─────────────┬──────────────┐
    │  Inner      │ ⭕ YELLOW PAD │
    │ forearm     │              │
    │ (smooth     ├──────────────┤
    │  skin)      │ Same position│
    │             │ as RED pad   │
    │             │ (mirror it)  │
    └─────────────┴──────────────┘
```

### 3. RIGHT LEG (BLACK PAD) - "RL" (GROUND)

```
    This is the MOST IMPORTANT pad for signal quality!
    
    Your leg standing or sitting:
    
           Upper leg
           ████████
           ████████
           
           Knee area
           ││││││││
           ││ ○ ││  ← BLACK pad goes here
           ││││││││     (inner side, above ankle)
           ││────││
           
           Ankle bone ⭕
           
           Foot
           ▓▓▓▓▓
    
    Position: Inner leg, just above ankle bone
    About 3-4 inches up from the ankle bump
    On the soft, smooth skin
```

## The "Triangle" Formation

When all three pads are placed correctly, they form a triangle:

```
        RA (Red)                LA (Yellow)
        /Forearm\               /Forearm\
       /          \            /          \
      ●────────────────────────●
      │                        │
      │      YOUR BODY         │
      │                        │
      │                        │
      └────────────────────────┘
                 │
                 │
              RL (Black)
              /Right Leg\
             /Above Ankle\
            ●
```

This is the standard ECG configuration - it measures the electrical activity of your HEART from different perspectives.

---

## Pressure Application - CRITICAL!

### Wrong Way ❌
```
Just stick and move:
┌───────────────┐
│ ⭕ Pad       │
│   stuck for   │
│   2 seconds   │
└───────────────┘
→ Result: Poor contact, will fall off
```

### RIGHT Way ✅
```
Press HARD and hold:
┌───────────────┐
│ ⭕ Pad       │
│   PRESS HARD  │
│   30-60 sec   │
│   Smooth out  │
│   all bubbles │
└───────────────┘
→ Result: Perfect contact, stays on
```

### What "Pressing Hard" Means
- Use your entire palm, not just fingertips
- Press down with moderate weight (like you're holding something in place)
- Smooth from center outward to remove air bubbles
- Hold for FULL 60 seconds (count them out!)
- You should see slight skin blanching under pad

---

## Skin Preparation - CRITICAL!

### Before Attaching Pads:

✅ DO:
- Clean with dry cloth
- If very hairy, shave gently
- Wipe away any dirt/dead skin
- Let skin dry completely (1-2 minutes)
- Use arm/leg that's relaxed and still

❌ DON'T:
- Use lotion or oils
- Attach over sweat
- Use damp skin
- Attach over bandages or scars
- Stretch or move the area

### Skin Contact Quality:

```
Good Contact:              Poor Contact:
┌──────────────┐         ┌──────────────┐
│ Pad sticks   │         │ Pad peeling  │
│ flat to skin │         │ at edges     │
│ Skin shows   │         │ Air bubbles  │
│ color change │         │ Loose corners│
└──────────────┘         └──────────────┘
  Result: ✅              Result: ❌
```

---

## Reading the Sensor Response

### After Pads Are Attached (30 seconds):

**Check Terminal Output:**

✅ GOOD (Pads Connected):
```
[10s] ✅ PADS CONNECTED (good signal!)
      V: -85.5 to +120.3 mV (avg: +15.2)
      Range: 205.8 mV
      LO-: false
```

❌ BAD (Pads Not Connected):
```
[10s] ❌ PADS NOT CONNECTED
      V: -1650.0 to -1650.0 mV (avg: -1650.0)
      Range: 0.0 mV
      LO-: true
```

⚠️ WEAK (Pads Loose):
```
[10s] ⚠️  PADS LOOSE (poor contact)
      V: -5.2 to +8.1 mV (avg: +1.5)
      Range: 13.3 mV
      LO-: false
```

---

## Emergency Reattachment

If pads aren't working:

1. **Remove all three pads**
2. **Let skin breathe** for 2 minutes
3. **Clean the area** again with dry cloth
4. **Wait 1 minute** for skin to fully dry
5. **Attach fresh pads** (old adhesive may be weak)
6. **Press for 60 seconds** each
7. **Wait 2 minutes** for adhesive to set
8. **Test again**

---

## Common Mistakes & Fixes

| Problem | Why | Fix |
|---------|-----|-----|
| `V: -1650 mV` (stuck) | Pads not touching | Press harder, 60 sec |
| `Range: 5 mV` (too small) | Loose contact | Reattach pads |
| `LO-: true` persistent | No electrical contact | Use new pads |
| Pad falls off during | Not pressed long enough | Do 60-second press |
| Signal noisy/jumping | Muscle movement | Sit still, relax arm |
| Only one pad working | Other two not connected | Check all three |

---

You're ready! Attach those pads and we'll get your ECG going! 🏥
