#!/bin/bash

# Stop Script for Development
# Gracefully stops both Frontend and Backend processes

echo "🛑 Stopping Autoscroller Game Services..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to kill processes by pattern
kill_processes() {
    local pattern=$1
    local service=$2
    
    PIDS=$(pgrep -f "$pattern" 2>/dev/null || true)
    
    if [[ -n "$PIDS" ]]; then
        echo -e "${YELLOW}Stopping $service processes: $PIDS${NC}"
        kill $PIDS 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        REMAINING=$(pgrep -f "$pattern" 2>/dev/null || true)
        if [[ -n "$REMAINING" ]]; then
            echo -e "${RED}Force killing $service: $REMAINING${NC}"
            kill -9 $REMAINING 2>/dev/null || true
        fi
        
        echo -e "${GREEN}✅ $service stopped${NC}"
    else
        echo -e "${GREEN}✅ $service was not running${NC}"
    fi
}

# Stop backend (.NET processes)
kill_processes "dotnet.*AutoscrollerAPI" "Backend"

# Stop frontend (Node.js processes)
kill_processes "ng serve" "Frontend"
kill_processes "node.*angular" "Frontend (Node)"

# Clean up log files
rm -f /tmp/backend.log /tmp/frontend.log 2>/dev/null || true

echo -e "${GREEN}🎮 All Autoscroller services stopped${NC}"