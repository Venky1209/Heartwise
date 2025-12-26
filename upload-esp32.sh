#!/bin/bash
echo "🔧 HeartWise ESP32 Upload"
echo "WiFi: venky / 12345678"
echo "Server: 10.172.9.74:5001"
echo ""
cd "$(dirname "$0")/arduino/HeartWise_ESP32_READY"
echo "📦 Compiling..."
arduino-cli compile --fqbn esp32:esp32:esp32 HeartWise_ESP32_READY.ino
echo ""
echo "⚠️  HOLD BOOT button, then press Enter..."
read
echo "📤 Uploading..."
arduino-cli upload -p /dev/cu.usbserial-10 --fqbn esp32:esp32:esp32 HeartWise_ESP32_READY.ino
