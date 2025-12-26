#!/usr/bin/env python3
"""
HeartWise USB Serial Bridge
Reads ECG data from ESP32 via USB and forwards to HeartWise backend

Usage:
    python usb_serial_bridge.py [--port /dev/cu.usbserial-xxx] [--baud 115200]

Requirements:
    pip install pyserial requests websocket-client
"""

import serial
import serial.tools.list_ports
import json
import time
import argparse
import threading
import sys
import requests
import websocket

# Configuration
DEFAULT_BAUD_RATE = 115200
BACKEND_URL = "http://localhost:5001"
WS_URL = "ws://localhost:5001/ws/usb-bridge"

class HeartWiseUSBBridge:
    def __init__(self, port=None, baud=DEFAULT_BAUD_RATE, backend_url=BACKEND_URL):
        self.port = port
        self.baud = baud
        self.backend_url = backend_url
        self.serial_conn = None
        self.ws = None
        self.running = False
        self.session_id = None
        self.device_id = None
        self.token = None
        
    def find_esp32_port(self):
        """Auto-detect ESP32 USB port"""
        print("🔍 Searching for ESP32...")
        ports = serial.tools.list_ports.comports()
        
        esp32_keywords = ['CP210', 'CH340', 'USB', 'Serial', 'UART', 'Silicon Labs']
        
        for port in ports:
            desc = f"{port.description} {port.manufacturer or ''}"
            if any(kw.lower() in desc.lower() for kw in esp32_keywords):
                print(f"   Found: {port.device} - {port.description}")
                return port.device
        
        # Show all available ports
        if ports:
            print("\n   Available ports:")
            for i, port in enumerate(ports):
                print(f"   [{i}] {port.device} - {port.description}")
            
            try:
                choice = int(input("\n   Select port number: "))
                return ports[choice].device
            except (ValueError, IndexError):
                pass
        
        return None
    
    def connect_serial(self):
        """Connect to ESP32 via USB Serial"""
        if not self.port:
            self.port = self.find_esp32_port()
        
        if not self.port:
            print("❌ No ESP32 found! Please connect the device.")
            return False
        
        try:
            self.serial_conn = serial.Serial(
                port=self.port,
                baudrate=self.baud,
                timeout=1
            )
            print(f"✅ Connected to {self.port} at {self.baud} baud")
            time.sleep(2)  # Wait for ESP32 to initialize
            
            # Request device info
            self.send_command("INFO")
            return True
            
        except serial.SerialException as e:
            print(f"❌ Serial connection failed: {e}")
            return False
    
    def connect_websocket(self):
        """Connect to backend via WebSocket"""
        try:
            self.ws = websocket.WebSocket()
            self.ws.connect(f"{self.backend_url.replace('http', 'ws')}/ws/usb-bridge")
            print("✅ Connected to HeartWise backend")
            return True
        except Exception as e:
            print(f"⚠️ WebSocket connection failed: {e}")
            print("   Data will be sent via HTTP API instead")
            return False
    
    def send_command(self, command):
        """Send command to ESP32"""
        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.write(f"{command}\n".encode())
            print(f"📤 Sent: {command}")
    
    def start_recording(self, session_id=None):
        """Start ECG recording"""
        if session_id:
            self.session_id = session_id
            cmd = json.dumps({"cmd": "start", "sessionId": session_id})
        else:
            cmd = "START"
        self.send_command(cmd)
    
    def stop_recording(self):
        """Stop ECG recording"""
        self.send_command("STOP")
        self.session_id = None
    
    def forward_to_backend(self, data):
        """Forward ECG data to backend"""
        try:
            if self.ws:
                self.ws.send(json.dumps(data))
            else:
                # HTTP fallback
                response = requests.post(
                    f"{self.backend_url}/api/ecg/data",
                    json=data,
                    headers={"Authorization": f"Bearer {self.token}"} if self.token else {}
                )
                if response.status_code != 200:
                    print(f"⚠️ Backend error: {response.status_code}")
        except Exception as e:
            print(f"⚠️ Failed to forward data: {e}")
    
    def read_serial_loop(self):
        """Main loop to read serial data"""
        buffer = ""
        
        while self.running:
            try:
                if self.serial_conn.in_waiting > 0:
                    chunk = self.serial_conn.read(self.serial_conn.in_waiting).decode('utf-8', errors='ignore')
                    buffer += chunk
                    
                    # Process complete JSON lines
                    while '\n' in buffer:
                        line, buffer = buffer.split('\n', 1)
                        line = line.strip()
                        
                        if line.startswith('{'):
                            try:
                                data = json.loads(line)
                                self.handle_data(data)
                            except json.JSONDecodeError:
                                print(f"📝 {line}")
                        elif line:
                            print(f"📝 {line}")
                
                time.sleep(0.01)  # Small delay to prevent CPU overload
                
            except serial.SerialException as e:
                print(f"❌ Serial error: {e}")
                self.running = False
                break
    
    def handle_data(self, data):
        """Handle incoming data from ESP32"""
        msg_type = data.get("type", "")
        
        if msg_type == "device-info":
            self.device_id = data.get("deviceId")
            print(f"\n📱 Device: {self.device_id}")
            print(f"   Firmware: {data.get('firmware')}")
            print(f"   Sample Rate: {data.get('sampleRate')} Hz")
            print(f"   Mode: {data.get('mode')}\n")
            
        elif msg_type == "ecg-data":
            points = data.get("data", [])
            print(f"📊 Received {len(points)} ECG samples")
            
            # Forward to backend
            self.forward_to_backend(data)
            
        elif msg_type == "status":
            print(f"📊 Status: Recording={data.get('recording')}, Buffer={data.get('bufferUsed')}")
        
        else:
            print(f"📦 {data}")
    
    def interactive_mode(self):
        """Interactive command mode"""
        print("\n" + "="*50)
        print("HeartWise USB Bridge - Interactive Mode")
        print("="*50)
        print("Commands:")
        print("  start     - Start ECG recording")
        print("  stop      - Stop ECG recording")
        print("  status    - Get device status")
        print("  info      - Get device info")
        print("  quit/exit - Exit program")
        print("="*50 + "\n")
        
        while self.running:
            try:
                cmd = input("heartwise> ").strip().lower()
                
                if cmd in ['quit', 'exit', 'q']:
                    self.running = False
                    break
                elif cmd == 'start':
                    self.start_recording()
                elif cmd == 'stop':
                    self.stop_recording()
                elif cmd == 'status':
                    self.send_command("STATUS")
                elif cmd == 'info':
                    self.send_command("INFO")
                elif cmd:
                    self.send_command(cmd.upper())
                    
            except EOFError:
                break
            except KeyboardInterrupt:
                print("\n")
                self.running = False
                break
    
    def run(self, interactive=True):
        """Main run method"""
        print("\n╔════════════════════════════════════════════╗")
        print("║   HeartWise USB Serial Bridge              ║")
        print("╚════════════════════════════════════════════╝\n")
        
        if not self.connect_serial():
            return
        
        self.connect_websocket()
        
        self.running = True
        
        # Start serial reading thread
        read_thread = threading.Thread(target=self.read_serial_loop, daemon=True)
        read_thread.start()
        
        if interactive:
            self.interactive_mode()
        else:
            # Non-interactive mode: just forward data
            try:
                while self.running:
                    time.sleep(1)
            except KeyboardInterrupt:
                pass
        
        self.cleanup()
    
    def cleanup(self):
        """Cleanup connections"""
        print("\n🔌 Shutting down...")
        self.running = False
        
        if self.serial_conn and self.serial_conn.is_open:
            self.send_command("STOP")
            time.sleep(0.5)
            self.serial_conn.close()
            print("   Serial connection closed")
        
        if self.ws:
            self.ws.close()
            print("   WebSocket connection closed")
        
        print("✅ Goodbye!")


def main():
    parser = argparse.ArgumentParser(description='HeartWise USB Serial Bridge')
    parser.add_argument('--port', '-p', help='Serial port (e.g., /dev/cu.usbserial-0001 or COM3)')
    parser.add_argument('--baud', '-b', type=int, default=DEFAULT_BAUD_RATE, help='Baud rate')
    parser.add_argument('--backend', '-u', default=BACKEND_URL, help='Backend URL')
    parser.add_argument('--no-interactive', '-n', action='store_true', help='Run without interactive mode')
    
    args = parser.parse_args()
    
    bridge = HeartWiseUSBBridge(
        port=args.port,
        baud=args.baud,
        backend_url=args.backend
    )
    
    bridge.run(interactive=not args.no_interactive)


if __name__ == "__main__":
    main()
