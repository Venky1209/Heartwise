#!/bin/bash

# HeartWise - Stop All Services
# This script stops Frontend, Backend, and ML Service

echo "🛑 Stopping HeartWise System..."

# Colors
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Kill processes on specific ports
echo -e "${YELLOW}Stopping Frontend (Port 3000)...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "   No process on port 3000"

echo -e "${YELLOW}Stopping Backend (Port 5001)...${NC}"
lsof -ti:5001 | xargs kill -9 2>/dev/null || echo "   No process on port 5001"

echo -e "${YELLOW}Stopping ML Service (Port 5002)...${NC}"
lsof -ti:5002 | xargs kill -9 2>/dev/null || echo "   No process on port 5002"

# Kill any remaining node/python processes related to the project
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "python.*app.py" 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ All HeartWise services stopped${NC}"
