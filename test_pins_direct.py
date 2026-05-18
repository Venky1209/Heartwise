#!/usr/bin/env python3
"""
Direct Pin Testing Script
Tests each GPIO pin individually to find hardware issues
"""

import serial
import time
import json

PORT = '/dev/cu.usbserial-10'
BAUD = 115200

def test_connection():
    """Test basic USB connection"""
    try:
        ser = serial.Serial(PORT, BAUD, timeout=1)
        print("✅ USB connection established\n")
        return ser
    except Exception as e:
        print(f"❌ Cannot connect to {PORT}: {e}")
        return None

def read_raw_pins(ser):
    """Read GPIO pin states directly"""
    print("=" * 60)
    print("READING GPIO PIN STATES")
    print("=" * 60)
    
    try:
        # Send STATUS command
        ser.write(b'STATUS\n')
        ser.flush()
        time.sleep(0.3)
        
        # Read response
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        
        if not line:
            print("❌ No response from ESP32")
            return None
        
        if line.startswith('{'):
            data = json.loads(line)
            
            print("\n📋 Device Status Response:")
            print(f"  Device ID: {data.get('deviceId', 'N/A')}")
            print(f"  Recording: {data.get('recording', 'N/A')}")
            print(f"  Buffer Used: {data.get('bufferUsed', 'N/A')} / 25")
            print(f"  Uptime: {data.get('uptime', 0)} seconds")
            print(f"  WiFi Connected: {data.get('wifi', False)}")
            print(f"  BLE Connected: {data.get('ble', False)}")
            
            # Look for GPIO debug info if available
            if 'gpio2_state' in data:
                print(f"\n  GPIO 2 (LO-): {data['gpio2_state']}")
            if 'gpio4_state' in data:
                print(f"  GPIO 4 (LO+): {data['gpio4_state']}")
            if 'rawADC' in data:
                print(f"  ADC Raw: {data['rawADC']}")
            
            return data
        else:
            print(f"Response: {line}")
            return None
            
    except json.JSONDecodeError as e:
        print(f"❌ JSON parse error: {e}")
        print(f"Raw response: {line}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def continuous_pin_monitor(ser, duration=30):
    """Monitor GPIO pins continuously"""
    print("\n" + "=" * 60)
    print(f"CONTINUOUS GPIO MONITORING ({duration} seconds)")
    print("=" * 60)
    
    # Start recording
    print("\n▶️ Starting recording...")
    ser.write(b'START\n')
    ser.flush()
    time.sleep(0.5)
    
    gpio2_samples = []
    gpio4_samples = []
    voltage_samples = []
    
    start_time = time.time()
    batch_count = 0
    
    try:
        while time.time() - start_time < duration:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            
            if not line:
                continue
            
            if line.startswith('{'):
                try:
                    data = json.loads(line)
                    
                    # Extract data batch
                    if 'data' in data:
                        batch_count += 1
                        for point in data['data']:
                            voltage_samples.append(point.get('voltage', 0))
                            # Note: GPIO states might be in individual points
                            if 'gpio2' in point:
                                gpio2_samples.append(point['gpio2'])
                            if 'gpio4' in point:
                                gpio4_samples.append(point['gpio4'])
                    
                    # Show progress
                    if batch_count % 10 == 0:
                        print(f"  ✓ {batch_count} batches received ({len(voltage_samples)} samples)")
                
                except json.JSONDecodeError:
                    pass
    
    except KeyboardInterrupt:
        print("\n⏹️ Stopped by user")
    
    # Stop recording
    ser.write(b'STOP\n')
    ser.flush()
    time.sleep(0.5)
    
    # Analyze results
    print(f"\n📊 ANALYSIS ({len(voltage_samples)} total samples):")
    
    if voltage_samples:
        min_v = min(voltage_samples)
        max_v = max(voltage_samples)
        avg_v = sum(voltage_samples) / len(voltage_samples)
        
        print(f"\n  Voltage Statistics:")
        print(f"    Min: {min_v:.2f} mV")
        print(f"    Max: {max_v:.2f} mV")
        print(f"    Avg: {avg_v:.2f} mV")
        print(f"    Range: {max_v - min_v:.2f} mV")
        
        # Check for signal quality
        if max_v - min_v < 10:
            print(f"\n  ⚠️  ISSUE: Voltage range < 10mV (signal is very weak or stuck)")
        elif max_v - min_v < 50:
            print(f"\n  ⚠️  WARNING: Voltage range < 50mV (weak signal)")
        else:
            print(f"\n  ✅ Good signal variation detected")
    
    if gpio2_samples:
        high_count = sum(1 for x in gpio2_samples if x)
        low_count = len(gpio2_samples) - high_count
        high_pct = (high_count / len(gpio2_samples)) * 100
        low_pct = (low_count / len(gpio2_samples)) * 100
        
        print(f"\n  GPIO 2 (LO-) State:")
        print(f"    HIGH: {high_count} samples ({high_pct:.1f}%)")
        print(f"    LOW:  {low_count} samples ({low_pct:.1f}%)")
        
        if high_pct > 40:
            print(f"    ⚠️  ISSUE: GPIO 2 HIGH >40% (leads detected as OFF/disconnected)")
        else:
            print(f"    ✅ GPIO 2 mostly LOW (leads should be detected as ON)")

def diagnose_hardware(ser):
    """Full hardware diagnostic"""
    print("\n" + "=" * 60)
    print("HARDWARE DIAGNOSTIC")
    print("=" * 60)
    
    print("\n1️⃣ Check Device Info:")
    ser.write(b'INFO\n')
    ser.flush()
    time.sleep(0.3)
    
    line = ser.readline().decode('utf-8', errors='ignore').strip()
    if line.startswith('{'):
        try:
            info = json.loads(line)
            print(f"   Device: {info.get('deviceId', 'N/A')}")
            print(f"   Firmware: {info.get('firmware', 'N/A')}")
            print(f"   Mode: {info.get('mode', 'N/A')}")
        except:
            pass
    
    print("\n2️⃣ Check Current Status:")
    status = read_raw_pins(ser)
    
    print("\n3️⃣ Expected Pin Configuration:")
    print("   GPIO 34: ECG_PIN (ADC input from AD8232 OUTPUT)")
    print("   GPIO 2:  LO_MINUS_PIN (lead detection)")
    print("   GPIO 4:  LO_PLUS_PIN (lead detection)")
    print("   GPIO 13: LED_PIN (status indicator)")
    
    print("\n4️⃣ What to Check Physically:")
    print("   □ Is AD8232 powered? (should have LED lit)")
    print("   □ Are three electrode pads attached?")
    print("   □ Is ESP32 GPIO 34 wire connected to AD8232 OUTPUT?")
    print("   □ Is ESP32 GPIO 2 wire connected to AD8232 LO-?")
    print("   □ Is ESP32 GPIO 4 wire connected to AD8232 LO+?")
    print("   □ Are all GND wires connected?")
    print("   □ Is 3.3V connected to AD8232?")

def main():
    print("\n" + "╔" + "=" * 58 + "╗")
    print("║" + " " * 10 + "HEARTWISE ECG - PIN DIAGNOSTIC TOOL" + " " * 14 + "║")
    print("╚" + "=" * 58 + "╝\n")
    
    ser = test_connection()
    if not ser:
        return
    
    try:
        # Quick status check
        read_raw_pins(ser)
        
        # Full diagnostic
        diagnose_hardware(ser)
        
        # Continuous monitoring
        print("\n" + "=" * 60)
        response = input("\nRun 30-second continuous GPIO monitor? (y/n): ").strip().lower()
        if response == 'y':
            continuous_pin_monitor(ser, duration=30)
        
        print("\n" + "=" * 60)
        print("NEXT STEPS:")
        print("=" * 60)
        print("""
If voltage range is 0 mV (stuck at -1650):
  → The AD8232 is detecting leads as OFF/disconnected
  → Check if pads are making good skin contact
  → Check GPIO 2 connection - it's the problem pin!

If GPIO 2 is HIGH >40% of the time:
  → GPIO 2 (LO-) is unstable or floating
  → Check wire connection from AD8232 LO- to GPIO 2
  → Try using GPIO 32 instead (more stable pin)

If everything looks normal but still no signal:
  → Try fresh electrode pads (old ones lose adhesion)
  → Check AD8232 module for shorts or damage
  → Verify power supply to AD8232 (3.3V working?)

Recommended fixes in order:
  1. Reseat GPIO 2 wire firmly
  2. Try GPIO 32 instead (edit Arduino code, change pin 2→32)
  3. Replace electrode pads with fresh ones
  4. Try different AD8232 module if available
        """)
    
    finally:
        ser.close()
        print("\n✅ Connection closed")

if __name__ == '__main__':
    main()
