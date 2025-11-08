# 🔌 HeartWise ECG - IoT Circuit Diagram Prompt

## 📋 AI Image Generation Prompt for Circuit Diagram

Use this prompt with AI image generators (DALL-E, Midjourney, Stable Diffusion, etc.):

---

### **Main Prompt:**

```
Create a professional IoT circuit diagram for a HeartWise ECG monitoring system with the following components and connections. Use a clean, technical schematic style with labeled components, clear wire paths, and color-coded connections.

COMPONENTS:
1. ESP32 DevKit Development Board (center, main microcontroller)
2. AD8232 Single Lead Heart Rate Monitor Module (left side)
3. Three ECG electrodes with 3.5mm connectors (top left)
4. USB cable connected to computer/power source (bottom right)
5. WiFi signal icon emanating from ESP32
6. Cloud server icon (top right) showing data transmission

CONNECTIONS:
ESP32 to AD8232:
- GPIO34 (ADC1_CH6) ← AD8232 OUTPUT pin (RED wire, analog signal)
- GPIO2 ← AD8232 LO- pin (YELLOW wire, leads-off detection)
- GPIO4 ← AD8232 LO+ pin (ORANGE wire, leads-off detection)
- 3.3V → AD8232 3.3V (RED wire, power)
- GND → AD8232 GND (BLACK wire, ground)

ECG Electrodes to AD8232:
- Right Arm (RA) electrode → AD8232 RA terminal (WHITE/GRAY wire)
- Left Arm (LA) electrode → AD8232 LA terminal (RED wire)
- Right Leg (RL) electrode → AD8232 RL terminal (BLACK wire, reference/ground)

Human Body Placement:
- Small human torso silhouette showing electrode placement:
  - RA: Right side of chest below collarbone
  - LA: Left side of chest below collarbone
  - RL: Lower right abdomen

Data Flow:
- Wavy ECG signal line from electrodes → AD8232 → ESP32 → WiFi icon → Cloud server
- Show "250 Hz sampling" label near AD8232 OUTPUT
- Show "WebSocket Stream" label near WiFi icon
- Show "Real-time ECG Data" label near cloud

Style:
- Clean white/light gray background
- Professional technical schematic look
- Clear component labels with black text
- Color-coded wires (RED=power, BLACK=ground, YELLOW/ORANGE=signals, BLUE=data)
- Component pin numbers clearly visible
- Dashed lines showing wireless communication
- Medical-grade aesthetic with teal/blue accent colors

Additional Labels:
- "HeartWise ECG Monitoring System" as title
- "ESP32 + AD8232 ECG Sensor" as subtitle
- Pin numbers labeled on ESP32 (GPIO34, GPIO2, GPIO4, 3.3V, GND)
- Voltage levels marked (3.3V logic)
- "250Hz Sample Rate" specification
- "Lead I Configuration" for ECG setup
```

---

## 🎨 Alternative Simplified Prompt (for faster generation):

```
Technical circuit diagram: ESP32 microcontroller connected to AD8232 ECG sensor module. 

Connections:
- AD8232 OUTPUT → ESP32 GPIO34 (red wire)
- AD8232 LO- → ESP32 GPIO2 (yellow wire)  
- AD8232 LO+ → ESP32 GPIO4 (orange wire)
- AD8232 3.3V ← ESP32 3.3V (red wire)
- AD8232 GND ← ESP32 GND (black wire)

Three ECG electrodes (RA, LA, RL) connected to AD8232 with placement on human chest diagram. WiFi icon showing wireless data transmission to cloud server. Clean professional schematic style with labeled pins and color-coded wires. Title: "HeartWise ECG IoT System"
```

---

## 🖼️ Recommended Tools for Creating Circuit Diagrams:

### **Online Tools (Free):**

1. **Fritzing** (fritzing.org)
   - Best for breadboard-style diagrams
   - Has ESP32 and sensor components
   - Export as PNG/PDF

2. **CircuitLab** (circuitlab.com)
   - Professional schematic editor
   - Clean, publication-ready diagrams

3. **EasyEDA** (easyeda.com)
   - Professional PCB design tool
   - Large component library
   - Free online editor

4. **draw.io / diagrams.net** (app.diagrams.net)
   - General diagramming tool
   - Has electrical component shapes
   - Very flexible and free

### **AI Image Generators:**

1. **DALL-E 3** (via ChatGPT Plus)
   - Use the main prompt above
   - Best for stylized diagrams

2. **Midjourney**
   - Use: `/imagine` + simplified prompt
   - Add: `--style technical --ar 16:9`

3. **Stable Diffusion** (stablediffusion.com)
   - Use main prompt
   - Add negative prompt: "blurry, unclear, messy, artistic"

---

## 📐 Specific Component Details for Manual Drawing:

### **ESP32 DevKit Pinout (30-pin version):**
```
Left Side (top to bottom):          Right Side (top to bottom):
EN                                  VP (GPIO36)
GPIO36                              VN (GPIO39)
GPIO39                              GPIO34 ★ ECG INPUT
GPIO34 ★ ECG INPUT                  GPIO35
GPIO35                              GPIO32
GPIO32                              GPIO33
GPIO33                              GPIO25
GPIO25                              GPIO26
GPIO26                              GPIO27
GPIO27                              GPIO14
GPIO14                              GPIO12
GPIO12                              GND
GND                                 GPIO13
GPIO13                              GPIO9 (FLASH)
GPIO9 (FLASH)                       GPIO10 (FLASH)
GPIO10 (FLASH)                      GPIO11 (FLASH)
GPIO11 (FLASH)                      GPIO8 (FLASH)
GPIO8 (FLASH)                       GPIO7 (FLASH)
GPIO7 (FLASH)                       GPIO6 (FLASH)
GPIO6 (FLASH)                       GPIO5
GPIO5                               GPIO4 ★ LO+
GPIO4 ★ LO+                         GPIO0
GPIO0                               GPIO2 ★ LO-
GPIO2 ★ LO-                         GPIO15
GPIO15                              3.3V ★ POWER
3.3V ★ POWER                        GND ★ GROUND
GND ★ GROUND                        5V
```

### **AD8232 Module Pins:**
```
Top Row (left to right):
GND, 3.3V, OUTPUT, LO-, LO+, SDN

Bottom Row (electrode connections):
RA, LA, RL
```

### **Wire Colors Standard:**
- **RED**: Power (3.3V)
- **BLACK**: Ground (GND)
- **YELLOW**: LO- signal
- **ORANGE**: LO+ signal
- **BLUE/GREEN**: ECG analog signal (OUTPUT → GPIO34)
- **WHITE/GRAY**: RA electrode
- **RED**: LA electrode  
- **BLACK**: RL electrode (reference)

---

## 📊 Data Flow Diagram Elements:

```
[Human Body] 
    ↓ (electrical heart signals)
[ECG Electrodes: RA, LA, RL]
    ↓ (3-lead connection)
[AD8232 ECG Sensor Module]
    ↓ (analog amplification & filtering)
[ESP32 GPIO34 - ADC]
    ↓ (250Hz sampling, 12-bit ADC)
[ESP32 Processing]
    ↓ (WiFi transmission)
[WebSocket Connection]
    ↓ (real-time streaming)
[Backend Server - Port 5001]
    ↓ (data processing)
[PostgreSQL Database]
    ↓ (storage & analysis)
[Frontend Web Interface]
    ↓ (visualization)
[Real-time ECG Waveform Display]
```

---

## 🎯 Key Specifications to Include in Diagram:

1. **Power Requirements:**
   - Operating Voltage: 3.3V DC
   - Current Draw: ~250mA (ESP32) + 170µA (AD8232)
   - USB Power: 5V input, regulated to 3.3V

2. **Signal Specifications:**
   - ECG Signal Output: 0-3.3V analog
   - ADC Resolution: 12-bit (0-4095)
   - Sampling Rate: 250 Hz
   - Lead Configuration: Lead I (LA-RA)

3. **Communication:**
   - WiFi: 2.4GHz 802.11 b/g/n
   - Protocol: WebSocket (real-time)
   - Data Format: JSON packets
   - Backend Port: 5001

4. **Sensor Specifications:**
   - Chip: AD8232 (Analog Devices)
   - Gain: 100x amplification
   - Bandwidth: 0.5-40 Hz (typical for ECG)
   - Leads-off Detection: Built-in (LO+/LO-)
   - Common Mode Rejection: High CMRR

---

## 🖨️ Print-Ready Specifications:

**For Professional Documentation:**
- Format: A4 or Letter size
- Resolution: 300 DPI minimum
- File Format: PDF or PNG
- Color Mode: RGB (for screen) or CMYK (for print)
- Fonts: Arial, Helvetica, or Roboto (sans-serif)
- Line Width: 1.5-2pt for wires, 0.5pt for component outlines

**Title Block Info:**
```
Project: HeartWise ECG Monitoring System
Component: ESP32 + AD8232 Circuit Diagram
Version: 1.0
Date: October 2025
Engineer: [Your Name]
Description: IoT ECG monitoring system with real-time
            wireless data transmission
```

---

## 💡 Tips for Best Results:

1. **Color Consistency**: Use same colors for power/ground across diagram
2. **Label Everything**: Every wire, pin, and connection should be labeled
3. **Show Voltage Levels**: Mark 3.3V and GND clearly
4. **Add Legends**: Include wire color legend and component specifications
5. **Keep It Clean**: Avoid wire crossings, use neat 90° angles
6. **Scale Properly**: Make components large enough to read pin labels
7. **Add Context**: Include small human silhouette showing electrode placement
8. **Professional Look**: Use grid background or clean white with border

---

## 🔍 Verification Checklist:

Before finalizing your circuit diagram, verify:

- [ ] All 5 connections between ESP32 and AD8232 are shown
- [ ] Pin numbers are correct (GPIO34, GPIO2, GPIO4, 3.3V, GND)
- [ ] Three electrodes (RA, LA, RL) are connected to AD8232
- [ ] Electrode placement on human body is illustrated
- [ ] Power connections (3.3V and GND) are clearly marked
- [ ] WiFi/wireless communication is depicted
- [ ] Component labels are readable
- [ ] Wire colors match standard conventions
- [ ] Data flow direction is indicated
- [ ] Title and project name are included

---

## 📸 Example Layout Description:

```
┌─────────────────────────────────────────────────────────┐
│              HeartWise ECG Monitoring System            │
│              ESP32 + AD8232 Circuit Diagram             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Human Torso]     [ECG           [ESP32              │
│   with 3          Electrodes]     DevKit]             │
│   electrode        RA LA RL         ┃                  │
│   positions         │  │  │          ┃                  │
│   marked            └──┴──┘          ┃                  │
│                         │            ┃                  │
│                    [AD8232 Module]   ┃                  │
│                    ┌─────────────┐   ┃                  │
│                    │ OUT LO- LO+ │   ┃                  │
│                    │  │   │   │  │   ┃                  │
│                    │  │   │   │  │   ┃                  │
│              RED ──┤─3.3V     GND├───┃── BLACK         │
│             BLUE ──┤─GPIO34      ├───┃                  │
│           YELLOW ──┤─GPIO2       ├───┃                  │
│           ORANGE ──┤─GPIO4       ├───┃                  │
│                    └─────────────┘   ┃                  │
│                         │            ┃                  │
│                         │         [WiFi]                │
│                         │            ↓                   │
│                    ECG Signal    [Cloud]                │
│                    250 Hz         Server                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Commands:

To view your current circuit setup:
```bash
cat /Users/gugank/New\ Idea/heartwise-ecg/ARDUINO_SETUP.md
cat /Users/gugank/New\ Idea/heartwise-ecg/ESP32_PIN_REFERENCE.md
```

To generate with AI:
1. Copy the "Main Prompt" section above
2. Paste into ChatGPT, DALL-E, or Midjourney
3. Adjust details as needed
4. Download and save to project documentation

---

**Need a custom circuit diagram? Feel free to use these specifications with any circuit design tool or AI image generator!** 🎨⚡
