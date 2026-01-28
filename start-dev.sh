#!/bin/bash

# Combined Start Script for Development
# Starts both Backend and Frontend in parallel with monitoring

set -e

PROJECT_ROOT=$(dirname "$(readlink -f "$0")")
BACKEND_DIR="$PROJECT_ROOT/Backend/AutoscrollerAPI"
FRONTEND_DIR="$PROJECT_ROOT/Frontend"

echo "🎮 Starting Autoscroller Game Development Environment..."
echo "Project Root: $PROJECT_ROOT"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    
    if [[ -n $BACKEND_PID ]]; then
        echo -e "${BLUE}Stopping Backend (PID: $BACKEND_PID)${NC}"
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [[ -n $FRONTEND_PID ]]; then
        echo -e "${BLUE}Stopping Frontend (PID: $FRONTEND_PID)${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Check if .NET is installed
if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}❌ .NET not found. Please install .NET 9 SDK${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js${NC}"
    exit 1
fi

# Start Backend
echo -e "${BLUE}🚀 Starting Backend...${NC}"
cd "$BACKEND_DIR"
dotnet run --environment Development > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"

# Wait a moment for backend to initialize
sleep 3

# Start Frontend
echo -e "${BLUE}🎨 Starting Frontend...${NC}"
cd "$FRONTEND_DIR"
npm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

echo ""
echo -e "${GREEN}🎮 ===== AUTOSCROLLER GAME READY =====${NC}"
echo -e "${BLUE}Frontend: http://localhost:4200${NC}"
echo -e "${BLUE}Backend API: http://localhost:5089/swagger${NC}"
echo -e "${YELLOW}Logs:${NC}"
echo -e "  Backend: tail -f /tmp/backend.log"
echo -e "  Frontend: tail -f /tmp/frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Monitor processes
while true; do
    # Check if backend is still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend crashed! Check /tmp/backend.log${NC}"
        exit 1
    fi
    
    # Check if frontend is still running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend crashed! Check /tmp/frontend.log${NC}"
        exit 1
    fi
    
    sleep 5
done