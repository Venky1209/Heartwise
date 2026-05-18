#!/usr/bin/env python3
"""
Real-time ECG Pad Connection Monitor
Shows if pads are attached and what voltage is being read
"""
import serial
import time
import json
import sys
from datetime import datetime

def main():
    try:
        print("\n" + "="*60)
        print("ECG PAD CONNECTION MONITOR")
        print("="*60)
        print("Connecting to ESP32...")
        
        ser = serial.Serial('/dev/cu.usbserial-10', 115200, timeout=1)
        print("✓ Serial port opened\n")
        
        time.sleep(1.5)
        
        # Send START
        print("Starting ECG sampling...\n")
        ser.write(b'START\n')
        ser.flush()
        
        print("─" * 60)
        print("WATCH THIS - It should change when you attach the pads:")
        print("─" * 60 + "\n")
        
        batch_count = 0
        max_v = -9999
        min_v = 9999
        leads_off_count = 0
        leads_on_count = 0
        
        start_time = time.time()
        
        while time.time() - start_time < 60:  # Run for 60 seconds
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            
            if line and line.startswith('{'):
                try:
                    data = json.loads(line)
                    
                    if data.get('type') == 'ecg-data':
                        points = data.get('data', [])
                        batch_count += 1
                        
                        if points:
                            voltages = [p.get('voltage', 0) for p in points]
                            lo_status = [p.get('leadsOff', False) for p in points]
                            
                            batch_min = min(voltages)
                            batch_max = max(voltages)
                            batch_avg = sum(voltages) / len(voltages)
                            leads_off = lo_status[0]  # Check first point
                            
                            # Track stats
                            if batch_min < min_v:
                                min_v = batch_min
                            if batch_max > max_v:
                                max_v = batch_max
                            
                            if leads_off:
                                leads_off_count += 1
                            else:
                                leads_on_count += 1
                            
                            # Determine status
                            if leads_off:
                                status = "❌ PADS NOT CONNECTED"
                                color = "\033[91m"  # Red
                            elif batch_max - batch_min < 10:
                                status = "⚠️  PADS LOOSE (poor contact)"
                                color = "\033[93m"  # Yellow
                            else:
                                status = "✅ PADS CONNECTED (good signal!)"
                                color = "\033[92m"  # Green
                            
                            reset = "\033[0m"
                            
                            # Print status
                            elapsed = int(time.time() - start_time)
                            print(f"{color}[{elapsed:2d}s] {status}{reset}")
                            print(f"     V: {batch_min:+7.1f} to {batch_max:+7.1f} mV (avg: {batch_avg:+7.1f})")
                            print(f"     Range: {batch_max - batch_min:.1f} mV")
                            print(f"     LO-: {leads_off}")
                            print()
                            
                except json.JSONDecodeError:
                    pass
        
        print("─" * 60)
        print("SUMMARY:")
        print("─" * 60)
        print(f"Batches received: {batch_count}")
        print(f"Voltage range: {min_v:.1f} to {max_v:.1f} mV")
        print(f"Overall range: {max_v - min_v:.1f} mV")
        print()
        
        if leads_off_count > leads_on_count:
            print("❌ PADS WERE NOT CONNECTED MOST OF THE TIME")
            print("   Check pad adhesion and skin contact")
        elif max_v - min_v < 20:
            print("⚠️  SIGNAL TOO SMALL - PADS MAY BE LOOSE")
            print("   Press pads more firmly, wait 30 seconds")
        else:
            print("✅ PADS WERE CONNECTED - GOOD SIGNAL!")
            print("   Ready to record in the web app")
        
        print()
        
        # Cleanup
        ser.write(b'STOP\n')
        ser.close()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nTroubleshooting:")
        print("1. Is ESP32 plugged in and powered?")
        print("2. Is USB cable connected?")
        print("3. Is ESP32 in USB mode (MODE 2)?")
        print("   - Hold BOOT button during USB connection for 3 seconds")
        print("   - LED should blink 3 times")

if __name__ == '__main__':
    main()
