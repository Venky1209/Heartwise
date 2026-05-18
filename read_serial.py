import serial
import time
import sys

try:
    ser = serial.Serial('/dev/cu.usbserial-10', 115200, timeout=1)
    print("Connected to /dev/cu.usbserial-10 at 115200 baud")
    while True:
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if line:
            print(line)
except Exception as e:
    print(f"Error: {e}")
except KeyboardInterrupt:
    print("\nExiting")
    sys.exit(0)
