#!/bin/bash

# HeartWise - Start All Services
# This script starts Frontend, Backend, and ML Service in parallel

echo "🚀 Starting HeartWise System..."
echo "================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Kill any existing processes on the ports
echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:5002 | xargs kill -9 2>/dev/null || true
sleep 1

# Create logs directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/logs"

# Start Backend Server
echo -e "${BLUE}🔧 Starting Backend Server (Port 5001)...${NC}"
cd "$SCRIPT_DIR/backend"
npm start > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait a moment for backend to initialize
sleep 2

# Start ML Service
echo -e "${BLUE}🤖 Starting ML Service (Port 5002)...${NC}"
cd "$SCRIPT_DIR/ml-service"
python3 app.py > "$SCRIPT_DIR/logs/ml-service.log" 2>&1 &
ML_PID=$!
echo "   ML Service PID: $ML_PID"

# Wait for ML models to load
sleep 3

# Start Frontend
echo -e "${BLUE}💻 Starting Frontend (Port 3000)...${NC}"
cd "$SCRIPT_DIR/frontend"
npm start > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo "================================"
echo -e "📊 Backend:  http://localhost:5001"
echo -e "🤖 ML Service: http://localhost:5002"
echo -e "💻 Frontend: http://localhost:3000"
echo ""
echo -e "${YELLOW}📝 Logs are being written to:${NC}"
echo "   - Backend:    logs/backend.log"
echo "   - ML Service: logs/ml-service.log"
echo "   - Frontend:   logs/frontend.log"
echo ""
echo -e "${YELLOW}💡 To stop all services, run:${NC}"
echo "   ./stop-all.sh"
echo ""
echo -e "${YELLOW}💡 To view live logs, run:${NC}"
echo "   tail -f logs/backend.log"
echo "   tail -f logs/ml-service.log"
echo "   tail -f logs/frontend.log"
echo ""
echo -e "${GREEN}🎉 HeartWise is ready!${NC}"
echo "   Opening browser in 5 seconds..."

# Wait a bit for services to fully start
sleep 5

# Open browser (works on macOS)
if command -v open &> /dev/null; then
    open http://localhost:3000
fi

# Keep script running and show status
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    kill $ML_PID 2>/dev/null
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:5001 | xargs kill -9 2>/dev/null || true
    lsof -ti:5002 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT TERM

# Wait indefinitely
while true; do
    sleep 1
done
