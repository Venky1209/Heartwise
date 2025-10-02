# 🚀 HeartWise ECG - Quick Start Guide

This guide will help you get the HeartWise ECG monitoring system up and running quickly.

## 📋 Prerequisites

Before you start, ensure you have:

### Required Software
- **Node.js 16+** - [Download](https://nodejs.org/)
- **PostgreSQL 12+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/downloads)

### Optional (for Docker deployment)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **Docker Compose** - Usually included with Docker Desktop

### Hardware (for ECG monitoring)
- ESP32 Development Board
- AD8232 ECG Sensor Module
- 3x ECG Electrodes
- USB Cable for ESP32
- Arduino IDE - [Download](https://www.arduino.cc/en/software)

---

## 🎯 Quick Start (3 Options)

### Option 1: Docker (Easiest) ⭐ RECOMMENDED

**Best for**: Quick testing and production deployment

```bash
# 1. Navigate to project directory
cd /Users/gugank/New\ Idea/heartwise-ecg

# 2. Run deployment script (automatically sets everything up)
./deploy.sh

# That's it! The system will be available at:
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

The deployment script will:
- ✅ Check dependencies
- ✅ Create environment configuration
- ✅ Set up PostgreSQL database
- ✅ Build and start all services
- ✅ Initialize the database schema
- ✅ Display access URLs

---

### Option 2: Manual Setup (More Control)

**Best for**: Development and customization

#### Step 1: Set up PostgreSQL Database

```bash
# Start PostgreSQL (if not already running)
# macOS with Homebrew:
brew services start postgresql@15

# Create database and user
psql postgres
```

In PostgreSQL prompt:
```sql
CREATE DATABASE heartwise_ecg;
CREATE USER heartwise_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE heartwise_ecg TO heartwise_user;
\q
```

Import the schema:
```bash
cd /Users/gugank/New\ Idea/heartwise-ecg
psql -U heartwise_user -d heartwise_ecg -f database/schema.sql
```

#### Step 2: Set up Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env
# Update these values:
# DB_PASSWORD=your_password
# DB_USER=heartwise_user
# DB_NAME=heartwise_ecg

# Start the backend server
npm run dev
```

Backend will run at: **http://localhost:5000**

#### Step 3: Set up Frontend

Open a new terminal:

```bash
# Navigate to frontend directory
cd /Users/gugank/New\ Idea/heartwise-ecg/frontend

# Install dependencies
npm install

# Create environment file (optional)
echo "REACT_APP_BACKEND_URL=http://localhost:5000" > .env

# Start the development server
npm start
```

Frontend will open automatically at: **http://localhost:3000**

---

### Option 3: Docker Compose (Manual)

**Best for**: Containerized deployment without automation

```bash
cd /Users/gugank/New\ Idea/heartwise-ecg

# Create .env file
cat > .env << EOF
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
EOF

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

---

## 🔧 Hardware Setup (ESP32 + AD8232)

### Step 1: Install Arduino Libraries

1. Open Arduino IDE
2. Go to **Tools → Manage Libraries**
3. Install these libraries:
   - `WebSockets` by Markus Sattler
   - `ArduinoJson` by Benoit Blanchon

### Step 2: Configure Arduino Code

1. Open: `/Users/gugank/New Idea/heartwise-ecg/arduino/heartwise_ecg_monitor.ino`
2. Update WiFi credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
3. Update server IP (use your computer's IP address):
   ```cpp
   const char* server_host = "192.168.1.XXX"; // Your computer's IP
   ```

### Step 3: Get Your Computer's IP Address

```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I

# Windows (PowerShell)
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Wi-Fi).IPAddress
```

### Step 4: Wire the Hardware

**ESP32 to AD8232 Connections:**
```
AD8232 OUTPUT → ESP32 GPIO36 (A0)
AD8232 LO-    → ESP32 GPIO2  (D2)
AD8232 LO+    → ESP32 GPIO4  (D3)
AD8232 SDN    → ESP32 GPIO5  (D4)
AD8232 3.3V   → ESP32 3.3V
AD8232 GND    → ESP32 GND
```

### Step 5: Upload Code to ESP32

1. Connect ESP32 to computer via USB
2. In Arduino IDE:
   - Select **Tools → Board → ESP32 Dev Module**
   - Select **Tools → Port → [Your ESP32 Port]**
   - Click **Upload** button
3. Open **Tools → Serial Monitor** (115200 baud)
4. You should see connection messages

### Step 6: Connect ECG Electrodes

Standard 3-lead placement:
- **RA (Right Arm)**: Right shoulder or right wrist
- **LA (Left Arm)**: Left shoulder or left wrist  
- **RL (Right Leg)**: Right lower abdomen or right ankle

---

## 🎮 Using the System

### 1. Access the Web Interface

Open your browser and go to: **http://localhost:3000**

### 2. Add a Patient

1. Click **"Patients"** in the sidebar
2. Click **"Add Patient"** button
3. Fill in patient information
4. Click **"Add Patient"**

### 3. Start ECG Monitoring

1. Click **"ECG Monitor"** in the sidebar
2. Select a patient from the dropdown
3. Select your ESP32 device
4. Click **"Start ECG Session"**
5. Watch the real-time ECG graph!

### 4. View Results

- Real-time heart rate displayed
- Signal quality indicators
- Session data automatically saved
- Export data as CSV for analysis

---

## 🔍 Verification & Testing

### Test Backend API

```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","database":"connected"}
```

### Test Database Connection

```bash
psql -U heartwise_user -d heartwise_ecg -c "SELECT COUNT(*) FROM patients;"
```

### Test Frontend

Open: http://localhost:3000
- You should see the HeartWise dashboard
- Navigation menu on the left
- System status showing "Online"

### Test ESP32 Device

In Arduino Serial Monitor, you should see:
```
=== HeartWise ECG Monitor Starting ===
Device ID: XXXXXXXXXXXX
Connecting to WiFi: YOUR_SSID
WiFi connected!
IP address: 192.168.1.XXX
Socket connected to: ...
Device registered successfully
```

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check if port 5000 is already in use
lsof -i :5000

# Kill the process if needed
kill -9 [PID]

# Check PostgreSQL is running
pg_isready -U heartwise_user -d heartwise_ecg
```

### Frontend won't start

```bash
# Check if port 3000 is already in use
lsof -i :3000

# Kill the process if needed
kill -9 [PID]

# Clear npm cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database connection errors

```bash
# Reset database
dropdb heartwise_ecg
createdb heartwise_ecg
psql -U heartwise_user -d heartwise_ecg -f database/schema.sql

# Check PostgreSQL service
brew services list  # macOS
sudo systemctl status postgresql  # Linux
```

### ESP32 won't connect

1. Check WiFi credentials in Arduino code
2. Ensure ESP32 and computer are on same network
3. Verify server IP address is correct
4. Check Serial Monitor for error messages
5. Try uploading code again

### WebSocket connection fails

1. Check backend is running: `curl http://localhost:5000/api/health`
2. Check browser console for errors (F12)
3. Verify CORS settings in backend
4. Try restarting both backend and frontend

---

## 📊 System Status Commands

### Check All Services

```bash
# Using Docker
docker-compose ps

# Manual setup - check processes
ps aux | grep node
ps aux | grep postgres
```

### View Logs

```bash
# Docker logs
docker-compose logs -f

# Backend logs (manual)
cd backend && npm run dev

# Frontend logs (manual)
cd frontend && npm start
```

### Stop Services

```bash
# Docker
docker-compose down

# Manual (press Ctrl+C in each terminal)
# Then stop PostgreSQL:
brew services stop postgresql@15  # macOS
```

---

## 🎯 Next Steps

1. ✅ **System is Running** - Great! Try adding a patient
2. 📱 **Connect Hardware** - Upload Arduino code to ESP32
3. 🏥 **Start Monitoring** - Begin your first ECG session
4. 📊 **View Data** - Check sessions and analysis
5. 🔮 **AI Integration** - Ready for Hugging Face models

---

## 📚 Additional Resources

- **Full Documentation**: See `README.md`
- **API Documentation**: http://localhost:5000/api/health
- **Database Schema**: `database/schema.sql`
- **Arduino Code**: `arduino/heartwise_ecg_monitor.ino`

---

## 🆘 Need Help?

### Common Issues:
- Port conflicts → Kill process and restart
- Database errors → Check PostgreSQL service
- WiFi issues → Verify network and credentials
- Compilation errors → Install required Arduino libraries

### Development Tips:
- Use `npm run dev` for auto-reload during development
- Check browser console (F12) for frontend errors
- Use Arduino Serial Monitor for ESP32 debugging
- Test API endpoints with curl or Postman

---

## 🎉 Success Checklist

- [ ] PostgreSQL database is running
- [ ] Backend API responds at http://localhost:5000/api/health
- [ ] Frontend loads at http://localhost:3000
- [ ] Can add a patient successfully
- [ ] ESP32 device connects to WiFi
- [ ] ESP32 connects to backend WebSocket
- [ ] Can start an ECG monitoring session
- [ ] Real-time ECG graph displays data

**All checked?** You're ready to use HeartWise! 🏥💚

---

**Quick Commands Reference:**

```bash
# Start everything (Docker)
./deploy.sh

# Start manually
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm start

# Stop everything (Docker)
docker-compose down

# View logs
docker-compose logs -f
```