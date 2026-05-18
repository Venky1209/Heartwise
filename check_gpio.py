#!/usr/bin/env python3
"""
Test pad attachment by checking GPIO states
"""
import serial
import time
import json

try:
    ser = serial.Serial('/dev/cu.usbserial-10', 115200, timeout=2)
    print("\n✓ Connected")
    time.sleep(1.5)
    
    # Get status which now includes GPIO debug info
    ser.write(b'STATUS\n')
    ser.flush()
    time.sleep(0.3)
    
    print("\n📊 ESP32 STATUS:\n")
    
    line = ser.readline().decode('utf-8', errors='ignore').strip()
    if line.startswith('{'):
        try:
            data = json.loads(line)
            print(json.dumps(data, indent=2))
            
            if 'debug' in data:
                debug = data['debug']
                rawADC = debug.get('rawADC', 0)
                gpio2 = debug.get('gpio2_state', 'unknown')
                gpio4 = debug.get('gpio4_state', 'unknown')
                
                print("\n🔍 GPIO STATES:")
                print(f"   Raw ADC value: {rawADC}")
                print(f"   GPIO 2 (LO-): {'HIGH' if gpio2 else 'LOW'} ({gpio2})")
                print(f"   GPIO 4 (LO+): {'HIGH' if gpio4 else 'LOW'} ({gpio4})")
                
                print("\n📈 INTERPRETATION:")
                if gpio2 or gpio4:
                    print("   ❌ GPIO shows HIGH = Leads Off detected")
                    print("   → Pads may not be making contact")
                    print("   → Or sensors are not connected properly")
                else:
                    print("   ✅ GPIO shows LOW = Pads detected as connected!")
                    print("   → Problem might be in React frontend")
        except json.JSONDecodeError:
            print(f"Could not parse: {line}")
    
    ser.close()
    
except Exception as e:
    print(f"Error: {e}")
    print("\nMake sure:")
    print("  1. ESP32 is connected")
    print("  2. Arduino code is uploaded")
    print("  3. Pads are attached to your body")
