> **BrainSync Context Pumper** 🧠
> Dynamically loaded for active file: `ecg-monitor.html` (Domain: **Generic Logic**)

### 📐 Generic Logic Conventions & Fixes
- **[what-changed] what-changed in ecg-monitor.html**: File updated (external): ecg-monitor.html

Content summary (583 lines):
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HeartWise ECG Monitor - Real-Time Display</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-se
- **[what-changed] what-changed in view_ecg_output.py**: File updated (external): view_ecg_output.py

Content summary (123 lines):
#!/usr/bin/env python3
"""
HeartWise ECG Monitor - Serial Data Viewer
Reads JSON data from ESP32 and displays it in real-time
"""

import serial
import json
import time
from datetime import datetime

PORT = '/dev/cu.usbserial-10'
BAUD = 115200

def main():
    try:
        ser = serial.Serial(PORT, BAUD, timeout=1)
        print("✅ Connected to ESP32\n")
        time.sleep(2)  # Wait for Arduino to initialize
        
        print("=" * 80)
        print("📊 HeartWise ECG Monitor - Real-Time Da
