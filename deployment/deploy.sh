#!/bin/bash

# Autoscroller Deployment Script
# Run from project root directory

set -e

PROJECT_ROOT=$(pwd)
DEPLOY_PATH="/opt/autoscroller"

echo "Deploying Autoscroller Game..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (use sudo)" 
   exit 1
fi

# Stop service if running
if systemctl is-active --quiet autoscroller; then
    echo "Stopping autoscroller service..."
    systemctl stop autoscroller
fi

# Build backend
echo "Building backend..."
cd "$PROJECT_ROOT/Backend/AutoscrollerAPI"
dotnet publish -c Release -o "$DEPLOY_PATH/Backend/AutoscrollerAPI"

# Build frontend
echo "Building frontend..."
cd "$PROJECT_ROOT/Frontend"
npm ci --production
npm run build

# Copy frontend build
echo "Copying frontend files..."
mkdir -p "$DEPLOY_PATH/Frontend/dist"
cp -r dist/* "$DEPLOY_PATH/Frontend/dist/"

# Set permissions
echo "Setting permissions..."
chown -R arcade:arcade "$DEPLOY_PATH"

# Ensure database directory exists
mkdir -p /var/lib/autoscroller
chown arcade:arcade /var/lib/autoscroller
chmod 755 /var/lib/autoscroller

# Install systemd service
echo "Installing systemd service..."
cp "$PROJECT_ROOT/deployment/autoscroller.service" /etc/systemd/system/
systemctl daemon-reload

# Install nginx config
echo "Installing nginx config..."
cp "$PROJECT_ROOT/deployment/nginx.conf" /etc/nginx/sites-available/autoscroller
ln -sf /etc/nginx/sites-available/autoscroller /etc/nginx/sites-enabled/autoscroller

# Remove default nginx site
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Enable and start services
echo "Starting services..."
systemctl enable autoscroller
systemctl enable nginx
systemctl start autoscroller
systemctl restart nginx

echo "Deployment completed successfully!"
echo ""
echo "Service status:"
systemctl status autoscroller --no-pager -l
echo ""
echo "Your game should be accessible at http://localhost"
echo "API documentation at http://localhost/swagger"