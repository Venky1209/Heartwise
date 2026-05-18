#!/usr/bin/env python3
"""
Simulate USB ECG data by directly reading from ESP32 and forwarding to frontend
This bypasses the WebSerial limitation for debugging
"""
import serial
import time
import json

try:
    # Open the port
    ser = serial.Serial('/dev/cu.usbserial-10', 115200, timeout=1)
    print("✓ Connected to /dev/cu.usbserial-10")
    
    time.sleep(1.5)
    
    # Send START command
    print("→ Sending START command...")
    ser.write(b"START\n")
    ser.flush()
    
    # Read data for 10 seconds
    print("← Reading ECG data...\n")
    end_time = time.time() + 10
    batch_count = 0
    
    while time.time() < end_time:
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if line and line.startswith('{'):
            try:
                data = json.loads(line)
                if data.get('type') == 'ecg-data':
                    batch_count += 1
                    points = data.get('data', [])
                    print(f"📊 Batch #{batch_count}: {len(points)} samples")
                    if points:
                        first = points[0]
                        last = points[-1]
                        print(f"   First: V={first.get('voltage'):.2f}mV, Q={first.get('quality')}, LO={first.get('leadsOff')}")
                        print(f"   Last:  V={last.get('voltage'):.2f}mV, Q={last.get('quality')}, LO={last.get('leadsOff')}")
                elif data.get('type') in ['status', 'device-info']:
                    print(f"ℹ️  {data.get('type')}: {data}")
                else:
                    print(f"❓ Unknown type: {data}")
            except json.JSONDecodeError as e:
                print(f"❌ JSON parse error: {line}")
    
    # Send STOP
    print("\n→ Sending STOP command...")
    ser.write(b"STOP\n")
    ser.flush()
    print("✓ Done")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    try:
        ser.close()
    except:
        pass
