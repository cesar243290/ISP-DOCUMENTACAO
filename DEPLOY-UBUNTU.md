# ISP NOC System - Ubuntu Server Deployment Guide

Complete guide for deploying the ISP NOC System on Ubuntu Server with MariaDB.

## System Architecture

```
┌──────────────────────┐
│   Nginx (Port 80)    │  ← User Access
└──────────┬───────────┘
           │
     ┌─────┴─────┐
     │           │
┌────▼───┐  ┌───▼──────┐
│ React  │  │ Express  │
│ (SPA)  │  │   API    │
└────────┘  └────┬─────┘
                 │
            ┌────▼────┐
            │ MariaDB │
            └─────────┘
```

## Prerequisites

- Ubuntu Server 20.04 or 22.04
- Root or sudo access
- Minimum 2GB RAM
- 20GB disk space

## Quick Installation (Automated)

The fastest way to deploy is using the provided script:

```bash
# 1. Upload files to server
scp -r /path/to/project root@your-server:/opt/isp-noc

# 2. SSH into server
ssh root@your-server

# 3. Run deployment script
cd /opt/isp-noc
chmod +x deploy.sh
sudo ./deploy.sh
```

The script will:
- Install Node.js, Nginx, MariaDB
- Create database and import schema
- Configure backend and frontend
- Set up PM2 for process management
- Configure Nginx reverse proxy
- Start all services

After completion, access your system at: `http://your-server-ip`

## Manual Installation

If you prefer to install manually, follow these steps:

### 1. Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y curl wget git build-essential
```

### 2. Install Node.js 18.x

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version
```

### 3. Install and Configure MariaDB

```bash
# Install MariaDB
sudo apt install -y mariadb-server

# Secure installation
sudo mysql_secure_installation
```

Answer the prompts:
- Set root password: **Yes**
- Remove anonymous users: **Yes**
- Disallow root login remotely: **Yes**
- Remove test database: **Yes**
- Reload privilege tables: **Yes**

```bash
# Create database and user
sudo mysql

# In MySQL prompt:
CREATE DATABASE isp_noc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'isp_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON isp_noc.* TO 'isp_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Import Database Schema

```bash
# Navigate to project directory
cd /opt/isp-noc

# Import schema
mysql -u isp_user -p isp_noc < server/database/schema.sql

# Import seed data (creates admin user)
mysql -u isp_user -p isp_noc < seed.sql
```

### 5. Configure Backend

```bash
cd /opt/isp-noc/server

# Create .env file
cat > .env <<EOF
PORT=3001
DB_HOST=localhost
DB_USER=isp_user
DB_PASSWORD=your_secure_password
DB_NAME=isp_noc
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
NODE_ENV=production
EOF

# Install dependencies
npm install --production
```

### 6. Build Frontend

```bash
cd /opt/isp-noc

# Create frontend .env
cat > .env <<EOF
VITE_API_URL=/api
EOF

# Install dependencies and build
npm install
npm run build
```

### 7. Install and Configure PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start backend
cd /opt/isp-noc/server
pm2 start server.js --name isp-noc-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the command output
```

### 8. Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/isp-noc
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Change this to your domain or use _

    root /opt/isp-noc/dist;
    index index.html;

    # Frontend - SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/isp-noc /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 9. Configure Firewall (Optional but Recommended)

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

## SSL/TLS Configuration (Recommended)

Install Let's Encrypt certificate:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Certbot will automatically:
# - Obtain certificate
# - Configure Nginx
# - Set up auto-renewal
```

## Verification

### Check Backend Status

```bash
# View PM2 status
pm2 status

# View backend logs
pm2 logs isp-noc-api

# Test API directly
curl http://localhost:3001/health
```

Expected output:
```json
{"status":"ok","timestamp":"2024-03-12T..."}
```

### Check Frontend

```bash
# Test Nginx configuration
sudo nginx -t

# Check if frontend files exist
ls -la /opt/isp-noc/dist

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Check Database

```bash
# Connect to database
mysql -u isp_user -p isp_noc

# Verify tables
SHOW TABLES;

# Check admin user
SELECT email, username, role FROM users WHERE role='ADMIN';

# Exit
EXIT;
```

## First Login

1. Open browser: `http://your-server-ip` or `https://your-domain.com`
2. Login with:
   - **Email**: `admin@admin.com`
   - **Password**: `admin123`
3. **IMPORTANT**: Change the password immediately!

## Maintenance

### Update Application

```bash
cd /opt/isp-noc

# Pull latest code (if using Git)
git pull

# Update backend
cd server
npm install --production
pm2 restart isp-noc-api

# Update frontend
cd ..
npm install
npm run build

# Clear browser cache
```

### Backup Database

```bash
# Create backup
mysqldump -u isp_user -p isp_noc > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
mysql -u isp_user -p isp_noc < backup_20240312_120000.sql
```

### View Logs

```bash
# Backend logs (PM2)
pm2 logs isp-noc-api
pm2 logs isp-noc-api --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MariaDB logs
sudo tail -f /var/log/mysql/error.log
```

### Restart Services

```bash
# Restart backend
pm2 restart isp-noc-api

# Restart Nginx
sudo systemctl restart nginx

# Restart MariaDB
sudo systemctl restart mariadb
```

## Troubleshooting

### Backend won't start

```bash
# Check if port 3001 is in use
sudo lsof -i :3001

# Check PM2 logs
pm2 logs isp-noc-api --err

# Verify .env file
cat /opt/isp-noc/server/.env

# Test database connection
mysql -u isp_user -p isp_noc -e "SELECT 1"
```

### Frontend shows blank page

```bash
# Check if build exists
ls /opt/isp-noc/dist/

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify Nginx configuration
sudo nginx -t

# Check browser console for errors (F12)
```

### Can't login

```bash
# Verify admin user exists
mysql -u isp_user -p isp_noc -e "SELECT email, username, role FROM users WHERE email='admin@admin.com'"

# Check backend logs
pm2 logs isp-noc-api

# Clear browser localStorage
# In browser console: localStorage.clear()

# Re-import seed data if needed
mysql -u isp_user -p isp_noc < seed.sql
```

### API returns 502 Bad Gateway

```bash
# Check if backend is running
pm2 status

# Check if backend is listening
curl http://localhost:3001/health

# Restart backend
pm2 restart isp-noc-api

# Check Nginx proxy configuration
sudo nginx -t
```

## Performance Tuning

### PM2 Cluster Mode

```bash
# Stop current instance
pm2 delete isp-noc-api

# Start in cluster mode (uses all CPUs)
pm2 start server.js --name isp-noc-api -i max

# Save configuration
pm2 save
```

### Nginx Caching

Add to Nginx configuration:

```nginx
# Cache static files
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### MariaDB Optimization

Edit `/etc/mysql/mariadb.conf.d/50-server.cnf`:

```ini
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 200
```

Restart MariaDB:
```bash
sudo systemctl restart mariadb
```

## Security Best Practices

1. **Change default passwords immediately**
2. **Keep system updated**:
   ```bash
   sudo apt update && sudo apt upgrade
   ```
3. **Enable firewall** (UFW)
4. **Use SSL/TLS** (Let's Encrypt)
5. **Regular backups**
6. **Monitor logs** regularly
7. **Limit SSH access** (use SSH keys)
8. **Use strong database passwords**

## Monitoring

### Setup System Monitoring

```bash
# Install htop for resource monitoring
sudo apt install -y htop

# Monitor in real-time
htop
```

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Generate startup script
pm2 startup
```

## Support

For issues:
1. Check logs: `pm2 logs isp-noc-api`
2. Check Nginx: `sudo nginx -t`
3. Check database connection
4. Review this troubleshooting guide

---

## Quick Reference Commands

```bash
# Backend
pm2 status                    # Check status
pm2 logs isp-noc-api         # View logs
pm2 restart isp-noc-api      # Restart
pm2 stop isp-noc-api         # Stop

# Frontend/Nginx
sudo nginx -t                 # Test config
sudo systemctl reload nginx   # Reload
sudo systemctl restart nginx  # Restart

# Database
mysql -u isp_user -p isp_noc  # Connect
pm2 flush                     # Clear PM2 logs

# System
sudo systemctl status nginx   # Check Nginx
sudo systemctl status mariadb # Check DB
df -h                         # Check disk space
free -h                       # Check memory
```

---

**Deployment Status**: ✅ Production Ready
**Architecture**: Self-hosted, No Supabase
**Stack**: React + Express + MariaDB + Nginx
**Last Updated**: 2024
