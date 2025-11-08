#!/bin/bash

# HeartWise ECG System - Stop Script

echo "
╔════════════════════════════════════════════════════════╗
║                                                        ║
║        🛑 Stopping HeartWise ECG System...            ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Stop Node.js processes (Backend & Frontend)
echo "${BLUE}Stopping Backend and Frontend...${NC}"
killall node 2>/dev/null

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Node.js processes stopped${NC}"
else
    echo "${BLUE}ℹ️  No Node.js processes were running${NC}"
fi

# Stop PostgreSQL
echo "${BLUE}Stopping PostgreSQL...${NC}"
pkill -f "postgres -D /opt/homebrew/var/postgresql@15" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ PostgreSQL stopped${NC}"
else
    echo "${BLUE}ℹ️  PostgreSQL was not running${NC}"
fi

sleep 1

echo "
╔════════════════════════════════════════════════════════╗
║                                                        ║
║          ✅ All services have been stopped            ║
║                                                        ║
║  To start again, run: ./start.sh                      ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
"
