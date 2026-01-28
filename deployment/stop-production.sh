#!/bin/bash

# Stop Script for Linux Production
# Stops systemd services

echo "🛑 Stopping Autoscroller Production Services..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop autoscroller backend
echo -e "${YELLOW}Stopping Autoscroller Backend...${NC}"
sudo systemctl stop autoscroller
echo -e "${GREEN}✅ Backend stopped${NC}"

# Optionally stop nginx (comment out if nginx serves other sites)
echo -e "${YELLOW}Stopping Nginx...${NC}"
sudo systemctl stop nginx
echo -e "${GREEN}✅ Nginx stopped${NC}"

echo -e "${GREEN}🎮 All Autoscroller production services stopped${NC}"

# Show final status
echo ""
echo -e "${YELLOW}Final Status:${NC}"
sudo systemctl is-active autoscroller nginx || true