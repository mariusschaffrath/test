#!/bin/bash

# Production Start Script for Linux Arcade
# Starts all services using systemctl

set -e

echo "🎮 Starting Autoscroller Game Production Services..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    echo -e "${RED}❌ Don't run this script as root. Use sudo only for individual commands.${NC}"
    exit 1
fi

# Function to check service status
check_service() {
    local service=$1
    if systemctl is-active --quiet "$service"; then
        echo -e "${GREEN}✅ $service is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $service is not running${NC}"
        return 1
    fi
}

# Start autoscroller backend
echo -e "${BLUE}🚀 Starting Autoscroller Backend...${NC}"
sudo systemctl start autoscroller
sleep 2

# Start nginx
echo -e "${BLUE}🌐 Starting Nginx...${NC}"
sudo systemctl start nginx
sleep 1

# Check services
echo ""
echo -e "${YELLOW}📊 Service Status:${NC}"
check_service autoscroller
check_service nginx

echo ""

# Test connectivity
echo -e "${BLUE}🔍 Testing connectivity...${NC}"

# Test backend directly
if curl -s http://localhost:5089/api/highscores > /dev/null; then
    echo -e "${GREEN}✅ Backend API responding${NC}"
else
    echo -e "${RED}❌ Backend API not responding${NC}"
fi

# Test frontend through nginx
if curl -s -I http://localhost/ | grep -q "200 OK"; then
    echo -e "${GREEN}✅ Frontend accessible${NC}"
else
    echo -e "${RED}❌ Frontend not accessible${NC}"
fi

echo ""
echo -e "${GREEN}🎮 ===== AUTOSCROLLER ARCADE READY =====${NC}"
echo -e "${BLUE}Game Access: http://localhost${NC}"
echo -e "${BLUE}Admin API: http://localhost/swagger${NC}"
echo ""
echo -e "${YELLOW}Management Commands:${NC}"
echo "  Status: sudo systemctl status autoscroller nginx"
echo "  Stop: sudo systemctl stop autoscroller nginx"
echo "  Restart: sudo systemctl restart autoscroller nginx"
echo "  Logs: sudo journalctl -u autoscroller -f"