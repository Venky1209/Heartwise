#!/bin/bash

# HeartWise ESP32 - Arduino CLI Upload Script
# This script compiles and uploads the ESP32 code using Arduino CLI

echo ""
echo "🚀 HeartWise ESP32 - Arduino CLI Upload Script"
echo "=============================================="
echo ""

# Configuration
PROJECT_DIR="/Users/gugank/New Idea/heartwise-ecg"
SKETCH_DIR="$PROJECT_DIR/arduino"
SKETCH_FILE="$SKETCH_DIR/HeartWise_ESP32_READY.ino"
BOARD_FQBN="esp32:esp32:esp32"
UPLOAD_SPEED="115200"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if ESP32 is connected
echo "📡 Step 1: Detecting ESP32..."
echo ""

# List all serial ports
echo "Available ports:"
arduino-cli board list

echo ""
echo "Looking for ESP32 USB port..."
ESP32_PORT=$(ls /dev/cu.* 2>/dev/null | grep -iE "(usbserial|SLAB|cp210|ch340)" | head -n 1)

if [ -z "$ESP32_PORT" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  ESP32 not detected!${NC}"
    echo ""
    echo "Please connect your ESP32 via USB and try again."
    echo ""
    echo "Common ESP32 USB port names:"
    echo "  - /dev/cu.usbserial-xxxxx"
    echo "  - /dev/cu.SLAB_USBtoUART"
    echo "  - /dev/cu.wchusbserial-xxxxx"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Connect ESP32 via USB cable"
    echo "  2. Check cable supports data transfer (not just charging)"
    echo "  3. Install CP2102 driver if needed"
    echo "  4. Try different USB port"
    echo ""
    
    # Manual port selection
    read -p "Enter ESP32 port manually (or press Enter to exit): " MANUAL_PORT
    
    if [ -z "$MANUAL_PORT" ]; then
        echo "Exiting..."
        exit 1
    else
        ESP32_PORT="$MANUAL_PORT"
    fi
fi

echo -e "${GREEN}✓ ESP32 detected at: $ESP32_PORT${NC}"
echo ""

# Step 2: Verify sketch exists
echo "📄 Step 2: Verifying sketch file..."
if [ ! -f "$SKETCH_FILE" ]; then
    echo -e "${RED}✗ Error: Sketch file not found: $SKETCH_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Sketch file found${NC}"
echo ""

# Step 3: Display current configuration
echo "⚙️  Step 3: Current Configuration:"
echo "   WiFi SSID:    Dayalan"
echo "   WiFi Pass:    9994238295@D"
echo "   Server IP:    192.168.1.10"
echo "   Server Port:  5001"
echo ""

read -p "Is this configuration correct? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Please update the configuration in: $SKETCH_FILE"
    echo "Then run this script again."
    exit 0
fi

# Step 4: Compile the sketch
echo ""
echo "🔨 Step 4: Compiling sketch..."
echo ""

arduino-cli compile --fqbn $BOARD_FQBN "$SKETCH_FILE" --verbose

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}✗ Compilation failed!${NC}"
    echo ""
    echo "Common issues:"
    echo "  1. Missing libraries - Install with: arduino-cli lib install <library>"
    echo "  2. Syntax errors in code"
    echo "  3. Wrong board selected"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Compilation successful!${NC}"
echo ""

# Step 5: Upload to ESP32
echo "📤 Step 5: Uploading to ESP32..."
echo ""
echo "Press and hold the BOOT button on ESP32 if upload fails..."
echo ""

arduino-cli upload -p $ESP32_PORT --fqbn $BOARD_FQBN "$SKETCH_FILE" --verbose

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}✗ Upload failed!${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Press and hold BOOT button during upload"
    echo "  2. Check USB cable connection"
    echo "  3. Try different USB port"
    echo "  4. Close Arduino IDE if it's open"
    echo "  5. Reset ESP32 and try again"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Upload successful!${NC}"
echo ""

# Step 6: Open Serial Monitor
echo "📊 Step 6: Opening Serial Monitor..."
echo ""
echo "Press Ctrl+C to exit serial monitor"
echo "=============================================="
echo ""

sleep 2
arduino-cli monitor -p $ESP32_PORT -c baudrate=115200

echo ""
echo "✅ Done!"
echo ""
