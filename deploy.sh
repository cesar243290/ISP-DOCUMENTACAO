#!/bin/bash

# ISP NOC System - Ubuntu Deployment Script
# This script automates the deployment process on Ubuntu servers

set -e

echo "==========================================="
echo "  ISP NOC System - Deployment Script"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run this script with sudo"
    exit 1
fi

# Get installation directory
INSTALL_DIR="/opt/isp-noc"
info "Installation directory: $INSTALL_DIR"

# Step 1: Install system dependencies
info "Installing system dependencies..."
apt update
apt install -y curl wget git build-essential nginx mariadb-server

# Install Node.js 18.x
if ! command -v node &> /dev/null; then
    info "Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

node_version=$(node --version)
success "Node.js installed: $node_version"

# Install PM2
if ! command -v pm2 &> /dev/null; then
    info "Installing PM2..."
    npm install -g pm2
fi
success "PM2 installed"

# Step 2: Setup MariaDB
info "Setting up MariaDB..."
systemctl start mariadb
systemctl enable mariadb

# Create database and user
DB_NAME="isp_noc"
DB_USER="isp_user"
DB_PASS=$(openssl rand -base64 16)

info "Creating database: $DB_NAME"
mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

success "Database created: $DB_NAME"
success "Database user created: $DB_USER"

# Import schema
if [ -f "$INSTALL_DIR/server/database/schema.sql" ]; then
    info "Importing database schema..."
    mysql $DB_NAME < "$INSTALL_DIR/server/database/schema.sql"
    success "Schema imported"
fi

# Import seed data
if [ -f "$INSTALL_DIR/seed.sql" ]; then
    info "Importing seed data..."
    mysql $DB_NAME < "$INSTALL_DIR/seed.sql"
    success "Seed data imported"
fi

# Step 3: Configure backend
info "Configuring backend..."
mkdir -p "$INSTALL_DIR/server"
cd "$INSTALL_DIR/server"

# Create .env file
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

cat > .env <<EOF
PORT=3001
DB_HOST=localhost
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
DB_NAME=$DB_NAME
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
NODE_ENV=production
EOF

success "Backend .env created"

# Install backend dependencies
if [ -f "package.json" ]; then
    info "Installing backend dependencies..."
    npm install --production
    success "Backend dependencies installed"
fi

# Step 4: Build frontend
info "Building frontend..."
cd "$INSTALL_DIR"

# Create frontend .env
cat > .env <<EOF
VITE_API_URL=/api
EOF

# Install frontend dependencies and build
npm install
npm run build

success "Frontend built successfully"

# Step 5: Configure PM2
info "Configuring PM2..."
cd "$INSTALL_DIR/server"
pm2 delete isp-noc-api 2>/dev/null || true
pm2 start server.js --name isp-noc-api
pm2 save
pm2 startup systemd -u root --hp /root

success "PM2 configured and running"

# Step 6: Configure Nginx
info "Configuring Nginx..."

cat > /etc/nginx/sites-available/isp-noc <<'EOF'
server {
    listen 80;
    server_name _;

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
EOF

# Enable site
ln -sf /etc/nginx/sites-available/isp-noc /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx
systemctl enable nginx

success "Nginx configured"

# Step 7: Set permissions
info "Setting permissions..."
chown -R www-data:www-data "$INSTALL_DIR/dist"
chmod -R 755 "$INSTALL_DIR/dist"

success "Permissions set"

# Display summary
echo ""
echo "==========================================="
echo "  ✓ Deployment Completed Successfully!"
echo "==========================================="
echo ""
echo "System Information:"
echo "-------------------"
echo "Installation Dir: $INSTALL_DIR"
echo "Database: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Password: $DB_PASS"
echo ""
echo "Backend Configuration:"
echo "---------------------"
echo "API URL: http://localhost:3001"
echo "PM2 Process: isp-noc-api"
echo ""
echo "Frontend Configuration:"
echo "----------------------"
echo "Web Root: $INSTALL_DIR/dist"
echo "Nginx Config: /etc/nginx/sites-available/isp-noc"
echo ""
echo "Login Credentials:"
echo "-----------------"
echo "Email: admin@admin.com"
echo "Password: admin123"
echo ""
echo "⚠ IMPORTANT: Change the admin password after first login!"
echo ""
echo "Useful Commands:"
echo "---------------"
echo "View backend logs:   pm2 logs isp-noc-api"
echo "Restart backend:     pm2 restart isp-noc-api"
echo "View Nginx logs:     tail -f /var/log/nginx/error.log"
echo "Restart Nginx:       systemctl restart nginx"
echo ""
echo "Access your ISP NOC System:"
echo "http://$(hostname -I | awk '{print $1}')"
echo ""
echo "Deployed on: $(date)"
echo "==========================================="
