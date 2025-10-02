# HeartWise WiFi Setup Guide

## 🎉 No More Hardcoded WiFi Credentials!

Your ESP32 now uses **WiFiManager** - a smart configuration portal that eliminates the need to recompile firmware every time you change WiFi networks!

## 📚 First Time Setup

### 1. Install Required Library
In Arduino IDE:
- Go to **Sketch → Include Library → Manage Libraries**
- Search for **"WiFiManager"** by tzapu
- Click **Install**

### 2. Upload Firmware
- Upload the `HeartWise_ESP32_READY.ino` to your ESP32 (just once!)
- **No need to edit any WiFi credentials in the code!**

### 3. Configure WiFi via Web Portal

#### Step 1: Connect to ESP32's Hotspot
- ESP32 will create a WiFi hotspot named **"HeartWise-Setup"**
- Password: **"heartwise123"**
- Connect to it from your phone or laptop

#### Step 2: Open Configuration Portal
- Your browser should automatically open the portal
- If not, navigate to: **http://192.168.4.1**

#### Step 3: Enter Your Credentials
- Click **"Configure WiFi"**
- Select your home/office WiFi network
- Enter your WiFi password
- **Important:** Enter your backend server IP (e.g., `192.168.1.10`)
- Click **"Save"**

#### Step 4: Done!
- ESP32 will reboot and connect to your WiFi
- Credentials are saved permanently in ESP32's flash memory
- No need to reconfigure unless you change networks

## 🔄 Changing WiFi Networks

### Method 1: Reset and Reconfigure
1. Hold the **BOOT button** on ESP32 for **5 seconds**
2. ESP32 will reset WiFi settings and reboot
3. Follow the "Configure WiFi via Web Portal" steps above

### Method 2: Use the Portal
1. If ESP32 can't connect to saved WiFi, it will automatically start the portal
2. Connect to **"HeartWise-Setup"** hotspot
3. Configure new credentials

## 🛠️ Troubleshooting

### Portal Won't Open
- Make sure you're connected to **"HeartWise-Setup"** WiFi
- Try manually navigating to **192.168.4.1**
- Disable mobile data on your phone

### ESP32 Won't Connect to WiFi
- Check if your WiFi password is correct
- Make sure your WiFi is 2.4GHz (ESP32 doesn't support 5GHz-only networks)
- Try moving ESP32 closer to your router
- Hold BOOT button for 5 seconds to reset and try again

### Backend Server IP Changed
- Hold BOOT button for 5 seconds to reset
- Reconnect to "HeartWise-Setup"
- Enter the new server IP in the configuration portal

## 📱 What Gets Saved?
- WiFi SSID (network name)
- WiFi Password
- Backend Server IP address

## 🎯 Benefits
✅ **No more code editing** for WiFi changes  
✅ **No recompiling** needed  
✅ **Easy to move between networks** (home, office, lab)  
✅ **User-friendly web interface**  
✅ **Automatic reconnection** if WiFi drops  
✅ **Reset button** for easy reconfiguration  

## 🔒 Security Note
WiFi credentials are stored in ESP32's flash memory using the Preferences library. The setup portal password is "heartwise123" - consider changing this in the code for production use.
