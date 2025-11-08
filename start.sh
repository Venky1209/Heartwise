#!/bin/bash

# HeartWise ECG System - One-Click Start Script
# This script starts PostgreSQL, Backend, and Frontend

echo "
╔════════════════════════════════════════════════════════╗
║                                                        ║
║        🫀 HeartWise ECG System - Starting...         ║
║                                                        ║
╔════════════════════════════════════════════════════════╝
"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Start PostgreSQL
echo "${BLUE}[1/3] Starting PostgreSQL...${NC}"
postgres -D /opt/homebrew/var/postgresql@15 > /dev/null 2>&1 &
sleep 2

if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null ; then
    echo "${GREEN}✅ PostgreSQL is running on port 5432${NC}"
else
    echo "${RED}❌ PostgreSQL failed to start${NC}"
    exit 1
fi

# Step 2: Start Backend
echo "${BLUE}[2/3] Starting Backend Server...${NC}"
cd backend
npm start > /tmp/heartwise-backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    echo "${GREEN}✅ Backend is running on port 5001${NC}"
    echo "   Backend PID: $BACKEND_PID"
else
    echo "${RED}❌ Backend failed to start. Check /tmp/heartwise-backend.log${NC}"
    exit 1
fi

# Step 3: Start Frontend
echo "${BLUE}[3/3] Starting Frontend...${NC}"
cd ../frontend
BROWSER=none npm start > /tmp/heartwise-frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 5

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "${GREEN}✅ Frontend is running on port 3000${NC}"
    echo "   Frontend PID: $FRONTEND_PID"
else
    echo "${RED}❌ Frontend failed to start. Check /tmp/heartwise-frontend.log${NC}"
    exit 1
fi

echo "
╔════════════════════════════════════════════════════════╗
║                                                        ║
║          ✅ HeartWise ECG System is Ready!            ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  📊 Backend:  http://localhost:5001                   ║
║  🌐 Frontend: http://localhost:3000                   ║
║  💾 Database: PostgreSQL on port 5432                 ║
║                                                        ║
║  📱 Your Activation Code: HW-2024-ECG-001             ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  🔧 To stop all services:                             ║
║     ./stop.sh                                         ║
║                                                        ║
║  📝 Logs:                                             ║
║     Backend:  /tmp/heartwise-backend.log              ║
║     Frontend: /tmp/heartwise-frontend.log             ║
║                                                        ║
╚════════════════════════════════════════════════════════╝

Opening browser in 3 seconds...
"

sleep 3
open http://localhost:3000

echo "
${GREEN}All services are running!${NC}
Press Ctrl+C to view logs or keep this terminal open.
"

# Keep script running and tail logs
tail -f /tmp/heartwise-backend.log
