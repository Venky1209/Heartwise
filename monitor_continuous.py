#!/usr/bin/env python3
"""
Real-time ECG Data Monitor with Analysis
Continuously reads ESP32 data and performs analysis
"""
import serial
import time
import json
from collections import deque
from datetime import datetime

class ECGMonitor:
    def __init__(self, port='/dev/cu.usbserial-10', baudrate=115200):
        self.port = port
        self.baudrate = baudrate
        self.ser = None
        self.data_buffer = deque(maxlen=1000)  # Keep last 1000 points
        self.batches_received = 0
        self.errors = 0
        
    def connect(self):
        try:
            self.ser = serial.Serial(self.port, self.baudrate, timeout=1)
            print("✓ Connected to ESP32\n")
            time.sleep(1.5)
            return True
        except Exception as e:
            print(f"✗ Connection failed: {e}")
            return False
    
    def send_command(self, cmd):
        """Send command to ESP32"""
        try:
            self.ser.write(f"{cmd}\n".encode())
            self.ser.flush()
            time.sleep(0.2)
        except Exception as e:
            print(f"✗ Command failed: {e}")
    
    def read_line(self):
        """Read one line from serial"""
        try:
            line = self.ser.readline().decode('utf-8', errors='ignore').strip()
            return line
        except:
            return None
    
    def analyze_batch(self, data_points):
        """Analyze a batch of ECG data"""
        if not data_points:
            return None
        
        voltages = [p.get('voltage', 0) for p in data_points]
        leads_off = [p.get('leadsOff', False) for p in data_points]
        qualities = [p.get('quality', 0) for p in data_points]
        
        analysis = {
            'count': len(data_points),
            'min_v': min(voltages),
            'max_v': max(voltages),
            'avg_v': sum(voltages) / len(voltages),
            'range': max(voltages) - min(voltages),
            'leads_off': leads_off[0] if leads_off else False,
            'avg_quality': sum(qualities) / len(qualities) if qualities else 0,
        }
        
        return analysis
    
    def print_header(self):
        """Print the monitor header"""
        print("\n" + "="*80)
        print("  🏥 ECG REAL-TIME MONITOR & ANALYSIS")
        print("="*80)
        print(f"Port: {self.port} @ {self.baudrate} baud")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80 + "\n")
    
    def print_batch_info(self, analysis, batch_num):
        """Print analyzed batch info"""
        if not analysis:
            return
        
        leads_status = "❌ OFF" if analysis['leads_off'] else "✅ ON"
        
        # Determine signal quality
        if analysis['range'] < 10:
            signal_status = "⚠️  WEAK"
        elif analysis['leads_off']:
            signal_status = "❌ NO SIGNAL"
        else:
            signal_status = "✅ GOOD"
        
        print(f"\n[{self.batches_received}] {signal_status} | Leads: {leads_status}")
        print(f"    Voltage: {analysis['min_v']:+7.1f} to {analysis['max_v']:+7.1f} mV (range: {analysis['range']:6.1f})")
        print(f"    Average: {analysis['avg_v']:+7.1f} mV | Quality: {analysis['avg_quality']:.1f}%")
    
    def run_continuous(self, duration=60):
        """Run continuous monitoring"""
        if not self.connect():
            return
        
        self.print_header()
        
        print("Sending START command...")
        self.send_command('START')
        time.sleep(1)
        
        print("Monitoring for {} seconds...\n".format(duration))
        print("─" * 80)
        
        start_time = time.time()
        last_analysis = None
        batch_num = 0
        
        try:
            while time.time() - start_time < duration:
                line = self.read_line()
                
                if not line:
                    continue
                
                # Try to parse JSON
                if line.startswith('{'):
                    try:
                        data = json.loads(line)
                        msg_type = data.get('type', 'unknown')
                        
                        if msg_type == 'ecg-data':
                            data_points = data.get('data', [])
                            self.batches_received += 1
                            
                            # Analyze this batch
                            analysis = self.analyze_batch(data_points)
                            last_analysis = analysis
                            
                            # Add to buffer
                            self.data_buffer.extend(data_points)
                            
                            # Print info
                            self.print_batch_info(analysis, batch_num)
                            batch_num += 1
                            
                        elif msg_type == 'device-info':
                            print(f"\n📱 Device: {data.get('deviceId')} | FW: {data.get('firmware')}")
                        
                        elif msg_type == 'status':
                            print(f"\n⚙️  Status: Recording={data.get('recording')} | Buffer={data.get('bufferUsed')}")
                            if 'debug' in data:
                                debug = data['debug']
                                gpio2 = "HIGH" if debug.get('gpio2_state') else "LOW"
                                gpio4 = "HIGH" if debug.get('gpio4_state') else "LOW"
                                print(f"    Debug: GPIO2={gpio2} | GPIO4={gpio4} | RawADC={debug.get('rawADC')}")
                        
                    except json.JSONDecodeError:
                        self.errors += 1
                        if self.errors < 5:
                            print(f"⚠️  Parse error: {line[:50]}")
        
        except KeyboardInterrupt:
            print("\n\n⏸️  Stopped by user")
        
        finally:
            # Send STOP
            self.send_command('STOP')
            self.ser.close()
            
            # Print summary
            self.print_summary(last_analysis)
    
    def print_summary(self, last_analysis):
        """Print monitoring summary"""
        print("\n" + "="*80)
        print("  📊 MONITORING SUMMARY")
        print("="*80)
        print(f"Batches received: {self.batches_received}")
        print(f"Parse errors: {self.errors}")
        print(f"Total samples: {len(self.data_buffer)}")
        
        if self.data_buffer:
            all_voltages = [p.get('voltage', 0) for p in self.data_buffer]
            all_leads_off = [p.get('leadsOff', False) for p in self.data_buffer]
            
            print(f"\nVoltage range: {min(all_voltages):+.1f} to {max(all_voltages):+.1f} mV")
            print(f"Voltage range: {max(all_voltages) - min(all_voltages):.1f} mV")
            
            leads_off_count = sum(1 for lo in all_leads_off if lo)
            leads_on_count = len(all_leads_off) - leads_off_count
            
            print(f"Leads OFF count: {leads_off_count} samples")
            print(f"Leads ON count: {leads_on_count} samples")
            
            if leads_off_count > leads_on_count:
                print("\n❌ ANALYSIS: Pads were NOT properly connected")
                print("   → Voltage stuck at -1650mV most of the time")
                print("   → Check pad adhesion and skin contact")
            elif max(all_voltages) - min(all_voltages) < 20:
                print("\n⚠️  ANALYSIS: Signal is very small")
                print("   → Pads may be loose or have poor contact")
                print("   → Try pressing pads more firmly")
            else:
                print("\n✅ ANALYSIS: Good ECG signal detected!")
                print("   → Pads are properly connected")
                print("   → Ready to use in web application")
        
        print("="*80 + "\n")

if __name__ == '__main__':
    monitor = ECGMonitor()
    monitor.run_continuous(duration=60)
