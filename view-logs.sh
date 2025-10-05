#!/bin/bash

# HeartWise - View Logs
# This script shows live logs from all services

echo "📊 HeartWise Live Logs"
echo "======================"
echo "Press Ctrl+C to stop viewing logs"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Create logs directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/logs"

# Touch log files to ensure they exist
touch "$SCRIPT_DIR/logs/backend.log"
touch "$SCRIPT_DIR/logs/ml-service.log"
touch "$SCRIPT_DIR/logs/frontend.log"

# View all logs together with labels
tail -f "$SCRIPT_DIR/logs/backend.log" \
        "$SCRIPT_DIR/logs/ml-service.log" \
        "$SCRIPT_DIR/logs/frontend.log" | \
    awk '{
        if (/==>\s*logs\/backend.log\s*<==/) {
            print "\n\033[0;34m[BACKEND]\033[0m ----------------------------------------"
        } else if (/==>\s*logs\/ml-service.log\s*<==/) {
            print "\n\033[0;32m[ML SERVICE]\033[0m -------------------------------------"
        } else if (/==>\s*logs\/frontend.log\s*<==/) {
            print "\n\033[0;35m[FRONTEND]\033[0m --------------------------------------"
        } else if (!/^==>/ && !/^<==/ && NF > 0) {
            print $0
        }
    }'
