#!/bin/bash

# HeartWise - Status Check
# Shows the current status of all services

echo "🔍 HeartWise System Status"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Frontend (Port 3000)
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "💻 Frontend (Port 3000):  ${GREEN}✓ RUNNING${NC}"
    PID=$(lsof -ti:3000 | head -1)
    echo "   PID: $PID"
else
    echo -e "💻 Frontend (Port 3000):  ${RED}✗ NOT RUNNING${NC}"
fi
echo ""

# Check Backend (Port 5001)
if lsof -ti:5001 > /dev/null 2>&1; then
    echo -e "🔧 Backend (Port 5001):   ${GREEN}✓ RUNNING${NC}"
    PID=$(lsof -ti:5001 | head -1)
    echo "   PID: $PID"
else
    echo -e "🔧 Backend (Port 5001):   ${RED}✗ NOT RUNNING${NC}"
fi
echo ""

# Check ML Service (Port 5002)
if lsof -ti:5002 > /dev/null 2>&1; then
    echo -e "🤖 ML Service (Port 5002): ${GREEN}✓ RUNNING${NC}"
    PID=$(lsof -ti:5002 | head -1)
    echo "   PID: $PID"
else
    echo -e "🤖 ML Service (Port 5002): ${RED}✗ NOT RUNNING${NC}"
fi
echo ""

# Check PostgreSQL
if psql -U postgres -d heartwise_ecg -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "🗄️  PostgreSQL:            ${GREEN}✓ CONNECTED${NC}"
else
    echo -e "🗄️  PostgreSQL:            ${YELLOW}⚠ CHECK CONNECTION${NC}"
    echo "   Try: PGPASSWORD='gugan@2022' psql -U postgres -d heartwise_ecg -c 'SELECT 1;'"
fi
echo ""

# Summary
RUNNING=0
if lsof -ti:3000 > /dev/null 2>&1; then ((RUNNING++)); fi
if lsof -ti:5001 > /dev/null 2>&1; then ((RUNNING++)); fi
if lsof -ti:5002 > /dev/null 2>&1; then ((RUNNING++)); fi

echo "=========================="
if [ $RUNNING -eq 3 ]; then
    echo -e "${GREEN}🎉 All services are running!${NC}"
    echo "   Visit: http://localhost:3000"
elif [ $RUNNING -eq 0 ]; then
    echo -e "${RED}❌ No services running${NC}"
    echo "   Start with: ./start-all.sh"
else
    echo -e "${YELLOW}⚠️  $RUNNING/3 services running${NC}"
    echo "   Restart with: ./start-all.sh"
fi
