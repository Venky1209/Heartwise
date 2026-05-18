#!/usr/bin/env python3
"""
Diagnose GPIO 2 and GPIO 4 pin states on ESP32
"""
import serial
import time
import json

print("\n" + "="*60)
print("GPIO PIN STATE DIAGNOSTIC")
print("="*60)
print("\nThis will check what GPIO 2 and GPIO 4 are reading\n")

try:
    ser = serial.Serial('/dev/cu.usbserial-10', 115200, timeout=1)
    print("✓ Connected to ESP32")
    
    time.sleep(1.5)
    
    # Send INFO command to get device status
    print("\n→ Requesting device info...\n")
    ser.write(b'INFO\n')
    ser.flush()
    time.sleep(0.5)
    
    # Read and display info
    for i in range(5):
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if line:
            print(f"   {line}")
    
    # Send START
    print("\n→ Starting ECG sampling...\n")
    ser.write(b'START\n')
    ser.flush()
    time.sleep(0.5)
    
    print("Reading GPIO states in ECG data:\n")
    print("GPIO 2 (LO-) | GPIO 4 (LO+) | Voltage | Status")
    print("─" * 60)
    
    for batch in range(10):
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if line.startswith('{'):
            try:
                data = json.loads(line)
                if data.get('type') == 'ecg-data':
                    points = data.get('data', [])
                    if points:
                        first = points[0]
                        lo_minus = first.get('leadsOff')  # This reflects GPIO state
                        v = first.get('voltage', 0)
                        
                        # Try to infer GPIO states
                        if v == -1650:
                            status = "❌ NO SIGNAL (leads off detected)"
                            lo_state = "HIGH"
                        else:
                            status = "✅ SIGNAL OK"
                            lo_state = "LOW"
                        
                        print(f"   ?    |      ?      | {v:+7.1f} | {status}")
                        print(f"        (inferred: {lo_state})")
                        
            except:
                pass
    
    ser.write(b'STOP\n')
    ser.close()
    
    print("\n" + "="*60)
    print("ANALYSIS:")
    print("="*60)
    print("""
If voltage is always -1650:
  → GPIO 2 (LO-) is reading HIGH
  → This means either:
    1. Pads are NOT making electrical contact
    2. GPIO 2 is stuck/shorted
    3. AD8232 LO- pin is not connected
    4. AD8232 is not powered

If voltage is normal (±100 mV):
  → GPIO 2 is reading LOW
  → Pads ARE detected as connected
  → Problem is elsewhere (React frontend?)
    """)
    
except Exception as e:
    print(f"Error: {e}")
