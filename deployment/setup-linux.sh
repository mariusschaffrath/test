#!/bin/bash

# Autoscroller Linux Deployment Setup Script
# Run with sudo privileges

set -e

echo "Setting up Autoscroller Game for Linux Arcade..."

# Create application directory
echo "Creating application directories..."
mkdir -p /opt/autoscroller
mkdir -p /var/lib/autoscroller
mkdir -p /var/log/autoscroller

# Create arcade user if it doesn't exist
if ! id "arcade" &>/dev/null; then
    echo "Creating arcade user..."
    useradd -r -s /bin/false -d /opt/autoscroller arcade
fi

# Set ownership and permissions
echo "Setting permissions..."
chown -R arcade:arcade /opt/autoscroller
chown -R arcade:arcade /var/lib/autoscroller
chown -R arcade:arcade /var/log/autoscroller

chmod 755 /opt/autoscroller
chmod 755 /var/lib/autoscroller
chmod 755 /var/log/autoscroller

# Install .NET 9 if not present
if ! command -v dotnet &> /dev/null; then
    echo "Installing .NET 9..."
    wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
    dpkg -i packages-microsoft-prod.deb
    rm packages-microsoft-prod.deb
    apt-get update
    apt-get install -y dotnet-runtime-9.0
fi

# Install Node.js and npm if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "Installing nginx..."
    apt-get install -y nginx
fi

echo "Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Copy your application files to /opt/autoscroller/"
echo "2. Build the backend: cd /opt/autoscroller/Backend/AutoscrollerAPI && dotnet publish -c Release"
echo "3. Build the frontend: cd /opt/autoscroller/Frontend && npm install && npm run build"
echo "4. Copy autoscroller.service to /etc/systemd/system/"
echo "5. Run: systemctl enable autoscroller && systemctl start autoscroller"
echo "6. Configure nginx with the provided config"