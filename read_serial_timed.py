import serial
import time
import sys

try:
    # 1. Open the port
    ser = serial.Serial('/dev/cu.usbserial-10', 115200, timeout=1)
    print("Connected to /dev/cu.usbserial-10 at 115200 baud")
    
    # Give the ESP32 a moment to initialize after serial connection opens (auto-reset)
    time.sleep(1.5)
    
    # 2. Send the START command
    print("Sending 'START' command...")
    ser.write(b"START\n")
    # Might also need to send INFO
    ser.write(b"INFO\n")
    ser.flush()

    # 3. Listen for responses
    end_time = time.time() + 10  # run for 10 seconds
    while time.time() < end_time:
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if line:
            print(line)
    
    # 4. Stop when done to avoid leaving it recording in background endlessly
    print("Sending 'STOP' command...")
    ser.write(b"STOP\n")
    ser.flush()
    print("--- Finished reading 10 seconds of data ---")
    
except Exception as e:
    print(f"Error: {e}")
