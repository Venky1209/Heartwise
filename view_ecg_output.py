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
        print("📊 HeartWise ECG Monitor - Real-Time Data Viewer")
        print("=" * 80)
        print()
        
        sample_count = 0
        voltage_values = []
        gpio2_high = 0
        gpio2_low = 0
        
        print("Listening for data (Ctrl+C to stop)...\n")
        print(f"{'Time':<10} {'Raw ADC':<10} {'Voltage':<12} {'GPIO2':<6} {'GPIO4':<6} {'Leads':<10}")
        print("-" * 80)
        
        while True:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            
            if not line:
                continue
            
            # Try to parse JSON
            try:
                data = json.loads(line)
                
                raw = data.get('raw', 0)
                voltage = data.get('voltage', 0)
                gpio2 = data.get('gpio2', 0)
                gpio4 = data.get('gpio4', 0)
                leadsOff = data.get('leadsOff', False)
                
                # Track statistics
                voltage_values.append(voltage)
                if gpio2:
                    gpio2_high += 1
                else:
                    gpio2_low += 1
                
                sample_count += 1
                
                # Print current sample
                leads_status = "❌ OFF" if leadsOff else "✅ ON"
                time_str = datetime.now().strftime("%H:%M:%S")
                
                print(f"{time_str:<10} {raw:<10} {voltage:>10.2f}mV {gpio2:<6} {gpio4:<6} {leads_status:<10}")
                
                # Print stats every 100 samples
                if sample_count % 100 == 0:
                    print_stats(sample_count, voltage_values, gpio2_high, gpio2_low)
                    voltage_values = []
                    gpio2_high = 0
                    gpio2_low = 0
                    
            except json.JSONDecodeError:
                # Not JSON, might be status message
                if line.startswith("╔"):
                    print("\n" + line)
                elif line.startswith("║") or line.startswith("╚"):
                    print(line)
                elif line and not line.startswith("{"):
                    print(f"  {line}")
    
    except KeyboardInterrupt:
        print("\n\n⏹️ Stopped by user")
    except serial.SerialException as e:
        print(f"❌ Serial error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'ser' in locals():
            ser.close()
            print("✅ Serial connection closed")

def print_stats(count, voltages, high, low):
    """Print statistics for the last batch"""
    if not voltages:
        return
    
    min_v = min(voltages)
    max_v = max(voltages)
    avg_v = sum(voltages) / len(voltages)
    range_v = max_v - min_v
    
    print("  " + "-" * 76)
    print(f"  📊 Stats (last {count} samples):")
    print(f"     Voltage: Min={min_v:>8.2f}mV | Max={max_v:>8.2f}mV | Avg={avg_v:>8.2f}mV | Range={range_v:>8.2f}mV")
    print(f"     GPIO2:   HIGH={high:>3} ({high*100/(high+low):>5.1f}%) | LOW={low:>3} ({low*100/(high+low):>5.1f}%)")
    
    # Diagnose
    if range_v < 10:
        print(f"     ⚠️  WARNING: Signal range < 10mV (weak signal or pads not attached)")
    elif range_v < 50:
        print(f"     ⚠️  WARNING: Signal range < 50mV (weak signal)")
    else:
        print(f"     ✅ Good signal variation")
    
    if high > low * 2:
        print(f"     ⚠️  WARNING: GPIO2 HIGH >66% (leads detected as disconnected)")
    
    print("  " + "-" * 76)

if __name__ == '__main__':
    main()
