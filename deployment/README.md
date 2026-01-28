# Cross-Platform Deployment Notice

**Important:** Only Bash scripts (`.sh`) are supported for deployment and production. Windows scripts (`.ps1`, `.bat`) are deprecated and not supported for Linux or Docker environments. Always use the provided Bash scripts for setup, deployment, and management.

# Linux Deployment Guide for Autoscroller Game

This directory contains all necessary files to deploy the Autoscroller game on a Linux arcade system.

## Files Overview

- `appsettings.Production.json` - Production configuration for the backend
- `autoscroller.service` - Systemd service configuration
- `nginx.conf` - Nginx reverse proxy configuration
- `setup-linux.sh` - Initial system setup script
- `deploy.sh` - Application deployment script

## Quick Deployment

1. **Initial Setup** (run once):
   ```bash
   sudo chmod +x deployment/setup-linux.sh
   sudo deployment/setup-linux.sh
   ```

2. **Deploy Application**:
   ```bash
   sudo chmod +x deployment/deploy.sh
   sudo deployment/deploy.sh
   ```

3. **Verify Installation**:
   ```bash
   systemctl status autoscroller
   systemctl status nginx
   ```

## Manual Deployment Steps

### 1. System Prerequisites

```bash
# Install .NET 9 Runtime
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install -y dotnet-runtime-9.0

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt-get install -y nginx
```

### 2. Create System User

```bash
sudo useradd -r -s /bin/false -d /opt/autoscroller arcade
sudo mkdir -p /opt/autoscroller
sudo mkdir -p /var/lib/autoscroller
sudo chown -R arcade:arcade /opt/autoscroller /var/lib/autoscroller
```

### 3. Build and Deploy

```bash
# Build Backend
cd Backend/AutoscrollerAPI
dotnet publish -c Release -o /opt/autoscroller/Backend/AutoscrollerAPI

# Build Frontend
cd ../../Frontend
npm ci
npm run build
sudo cp -r dist/* /opt/autoscroller/Frontend/dist/

# Set permissions
sudo chown -R arcade:arcade /opt/autoscroller
```

### 4. Configure Services

```bash
# Install systemd service
sudo cp deployment/autoscroller.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable autoscroller

# Install nginx config
sudo cp deployment/nginx.conf /etc/nginx/sites-available/autoscroller
sudo ln -sf /etc/nginx/sites-available/autoscroller /etc/nginx/sites-enabled/autoscroller
sudo rm -f /etc/nginx/sites-enabled/default

# Start services
sudo systemctl start autoscroller
sudo systemctl restart nginx
```

## Configuration

### Database Location
- Production database: `/var/lib/autoscroller/highscores.db`
- Automatically created on first run
- Backed up with proper permissions for arcade user

### Network Configuration
- Backend: http://localhost:5089
- Frontend: Served by Nginx on port 80
- All traffic routed through Nginx reverse proxy

### Security Features
- Dedicated arcade user (non-login)
- Restricted file system access
- No new privileges for service
- Private temporary directories

## Monitoring

```bash
# Check service status
sudo systemctl status autoscroller

# View logs
sudo journalctl -u autoscroller -f

# Check nginx status
sudo systemctl status nginx

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Service Won't Start

1. **Check logs:**
   ```bash
   sudo journalctl -u autoscroller -n 50
   ```
   **Expected output (working):**
   ```
   Jan 12 10:15:32 arcade systemd[1]: Started Autoscroller Game Backend.
   Jan 12 10:15:33 arcade AutoscrollerAPI[1234]: info: Microsoft.Hosting.Lifetime[14]
   Jan 12 10:15:33 arcade AutoscrollerAPI[1234]: Now listening on: http://0.0.0.0:5089
   Jan 12 10:15:33 arcade AutoscrollerAPI[1234]: Application started.
   ```
   
   **Problem indicators:**
   ```
   # Permission denied
   Jan 12 10:15:32 arcade AutoscrollerAPI[1234]: Permission denied accessing '/var/lib/autoscroller'
   
   # Port already in use
   Jan 12 10:15:32 arcade AutoscrollerAPI[1234]: Unable to bind to http://0.0.0.0:5089
   
   # Missing dependencies
   Jan 12 10:15:32 arcade AutoscrollerAPI[1234]: Could not load file or assembly 'System.Data.SQLite'
   ```

2. **Verify permissions:**
   ```bash
   ls -la /opt/autoscroller
   ```
   **Expected output:**
   ```
   drwxr-xr-x  3 arcade arcade 4096 Jan 12 10:15 Backend/
   drwxr-xr-x  3 arcade arcade 4096 Jan 12 10:15 Frontend/
   ```

3. **Test manually:**
   ```bash
   sudo -u arcade dotnet /opt/autoscroller/Backend/AutoscrollerAPI/AutoscrollerAPI.dll
   ```
   **Expected output:**
   ```
   info: Microsoft.Hosting.Lifetime[14]
         Now listening on: http://0.0.0.0:5089
   info: Microsoft.Hosting.Lifetime[0]
         Application started. Press Ctrl+C to shut down.
   ```

### Database Issues

1. **Check database directory:**
   ```bash
   ls -la /var/lib/autoscroller/
   ```
   **Expected output:**
   ```
   total 12
   drwxr-xr-x  2 arcade arcade 4096 Jan 12 10:16 .
   drwxr-xr-x 42 root   root   4096 Jan 12 10:15 ..
   -rw-r--r--  1 arcade arcade 8192 Jan 12 10:16 highscores.db
   ```
   
   **Problem indicators:**
   ```
   # Missing database file (will be created automatically)
   total 8
   drwxr-xr-x  2 arcade arcade 4096 Jan 12 10:15 .
   drwxr-xr-x 42 root   root   4096 Jan 12 10:15 ..
   
   # Wrong permissions
   -rw-r--r--  1 root   root   8192 Jan 12 10:16 highscores.db
   ```

2. **Fix permissions:**
   ```bash
   sudo chown arcade:arcade /var/lib/autoscroller/highscores.db
   ```

3. **Test database connection:**
   ```bash
   sudo -u arcade sqlite3 /var/lib/autoscroller/highscores.db ".tables"
   ```
   **Expected output:**
   ```
   Highscores
   __EFMigrationsHistory
   ```

### Network Issues

1. **Test backend directly:**
   ```bash
   curl http://localhost:5089/api/highscores
   ```
   **Expected output:**
   ```json
   []
   ```
   Or with data:
   ```json
   [{"id":1,"playerName":"Player1","score":1500,"createdAt":"2026-01-12T10:16:00Z"}]
   ```
   
   **Problem indicators:**
   ```
   # Service not running
   curl: (7) Failed to connect to localhost port 5089: Connection refused
   
   # Service starting up
   curl: (56) Recv failure: Connection reset by peer
   ```

2. **Check nginx config:**
   ```bash
   sudo nginx -t
   ```
   **Expected output:**
   ```
   nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
   nginx: configuration file /etc/nginx/nginx.conf test is successful
   ```
   
   **Problem indicators:**
   ```
   nginx: [emerg] cannot load certificate "/path/to/cert": BIO_new_file() failed
   nginx: configuration file /etc/nginx/nginx.conf test failed
   ```

3. **Test frontend access:**
   ```bash
   curl -I http://localhost/
   ```
   **Expected output:**
   ```
   HTTP/1.1 200 OK
   Server: nginx/1.18.0
   Content-Type: text/html
   Content-Length: 615
   ```

4. **Check service connectivity:**
   ```bash
   netstat -tlnp | grep :5089
   ```
   **Expected output:**
   ```
   tcp        0      0 0.0.0.0:5089            0.0.0.0:*               LISTEN      1234/dotnet
   ```

### Common Error Solutions

**"System.Data.SQLite not found"**
```bash
sudo apt-get install libsqlite3-0
```

**"Port 5089 already in use"**
```bash
sudo netstat -tlnp | grep :5089
sudo kill -9 <PID>
```

**"Permission denied accessing database"**
```bash
sudo chown -R arcade:arcade /var/lib/autoscroller/
sudo chmod 755 /var/lib/autoscroller/
sudo chmod 644 /var/lib/autoscroller/highscores.db
```

**"Nginx 502 Bad Gateway"**
Check if backend is running:
```bash
systemctl status autoscroller
curl http://localhost:5089/api/highscores
```

## Updates

To update the application:

1. Stop the service: `sudo systemctl stop autoscroller`
2. Build new version: `dotnet publish -c Release`
3. Copy files to deployment directory
4. Start service: `sudo systemctl start autoscroller`

Or simply run the deployment script again: `sudo deployment/deploy.sh`