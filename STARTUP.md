# 🚀 HeartWise - One-Click Startup Guide

## Quick Start (One Command!)

### Method 1: Using the Shell Script (Recommended)
```bash
./start-all.sh
```

### Method 2: Using npm
```bash
npm start
```

Both commands will:
1. ✅ Kill any existing processes on ports 3000, 5001, 5002
2. ✅ Start Backend Server (Port 5001)
3. ✅ Start ML Service (Port 5002)
4. ✅ Start Frontend (Port 3000)
5. ✅ Automatically open browser to http://localhost:3000

---

## Services Overview

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Frontend** | 3000 | http://localhost:3000 | React web interface |
| **Backend** | 5001 | http://localhost:5001 | Node.js API server |
| **ML Service** | 5002 | http://localhost:5002 | Python ML/AI service |

---

## All Available Commands

### Start All Services
```bash
./start-all.sh
# or
npm start
```

### Stop All Services
```bash
./stop-all.sh
# or
npm run stop
```

### View Live Logs
```bash
./view-logs.sh
# or
npm run logs
```

### View Individual Logs
```bash
# Backend logs
tail -f logs/backend.log

# ML Service logs
tail -f logs/ml-service.log

# Frontend logs
tail -f logs/frontend.log
```

---

## What Happens When You Start

1. **Cleanup Phase** (1 second)
   - Kills any existing processes on ports 3000, 5001, 5002
   - Ensures clean startup

2. **Backend Start** (2 seconds)
   - Starts Node.js Express server
   - Connects to PostgreSQL database
   - Initializes WebSocket server for ESP32
   - Ready on http://localhost:5001

3. **ML Service Start** (3 seconds)
   - Starts Flask Python server
   - Loads ECG analysis models
   - Loads Google Gemini AI for diet recommendations
   - Ready on http://localhost:5002

4. **Frontend Start** (5 seconds)
   - Starts React development server
   - Opens browser automatically
   - Ready on http://localhost:3000

---

## Logs

All services write logs to the `logs/` directory:
- `logs/backend.log` - Backend API logs
- `logs/ml-service.log` - ML/AI service logs
- `logs/frontend.log` - React frontend logs

---

## Troubleshooting

### Ports Already in Use
The startup script automatically kills processes on ports 3000, 5001, 5002. If you still have issues:
```bash
./stop-all.sh
./start-all.sh
```

### Services Not Starting
1. Check logs:
   ```bash
   ./view-logs.sh
   ```

2. Verify dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   cd ../ml-service && pip3 install -r requirements.txt
   ```

### Database Connection Issues
Make sure PostgreSQL is running:
```bash
# Check if PostgreSQL is running
psql -U postgres -d heartwise_ecg -c "SELECT 1;"
```

### ML Service Issues
Ensure Python dependencies are installed:
```bash
cd ml-service
pip3 install -r requirements.txt
```

---

## Manual Service Control

If you need to start services individually:

### Backend Only
```bash
cd backend
npm start
```

### ML Service Only
```bash
cd ml-service
python3 app.py
```

### Frontend Only
```bash
cd frontend
npm start
```

---

## System Requirements

- **Node.js**: v14+ (for backend & frontend)
- **Python**: 3.9+ (for ML service)
- **PostgreSQL**: 12+ (database)
- **macOS/Linux**: Shell scripts use bash

---

## Features

✅ One-command startup  
✅ Automatic port cleanup  
✅ Background service management  
✅ Centralized logging  
✅ Automatic browser opening  
✅ Clean shutdown with Ctrl+C  
✅ Service health monitoring  

---

## Architecture

```
┌─────────────────┐
│   Frontend      │  React (Port 3000)
│   localhost:3000│
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Backend       │  Node.js Express (Port 5001)
│   localhost:5001│  ├─ REST API
└────────┬────────┘  ├─ WebSocket (ESP32)
         │           └─ PostgreSQL
         ↓
┌─────────────────┐
│   ML Service    │  Flask Python (Port 5002)
│   localhost:5002│  ├─ ECG Analysis
└─────────────────┘  ├─ Deep Learning
                     └─ Gemini AI (Diet)
```

---

## Next Steps After Startup

1. **Register/Login**: Create your account at http://localhost:3000
2. **Connect ESP32**: Ensure your ESP32 device is powered and on the same network
3. **Start Recording**: Begin ECG monitoring from the dashboard
4. **View Analysis**: Get real-time AI-powered ECG analysis
5. **AI Diet Recommendations**: Get personalized diet plans

---

## Support

For issues or questions:
- Check logs: `./view-logs.sh`
- Stop all: `./stop-all.sh`
- Clean start: `./stop-all.sh && ./start-all.sh`

---

**Enjoy HeartWise! 💚📊🏥**
