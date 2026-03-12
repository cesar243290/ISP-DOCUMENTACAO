# ISP NOC System - Quick Start Guide

## Architecture Overview

```
┌─────────────────────┐
│   React Frontend    │  (Vite + TypeScript)
│   Port 5173 (dev)   │
└──────────┬──────────┘
           │
           │ HTTP Requests
           │ Authorization: Bearer <JWT>
           │
      ┌────▼────┐
      │  Nginx  │  (Reverse Proxy)
      │  Port 80│
      └────┬────┘
           │
           │ /api/* → http://localhost:3001
           │
      ┌────▼──────────┐
      │ Node Express   │  (Backend API)
      │   Port 3001    │
      └────┬───────────┘
           │
           │ SQL Queries
           │
      ┌────▼───────────┐
      │ MySQL/MariaDB  │  (Local Database)
      │   Port 3306    │
      └────────────────┘
```

## No Supabase - Fully Self-Hosted

This system does NOT use Supabase or any external services. Everything runs on your own infrastructure.

## Local Development

### Prerequisites

- Node.js 18+
- MySQL or MariaDB
- npm

### 1. Setup Database

```bash
mysql -u root -p
CREATE DATABASE isp_noc;
USE isp_noc;
SOURCE server/database/schema.sql;
```

### 2. Configure Backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=isp_noc
JWT_SECRET=your-super-secret-jwt-key-change-this
ENCRYPTION_KEY=your-32-char-encryption-key
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
```

### 4. Start Backend

```bash
node server.js
```

You should see:
```
Server running on port 3001
Database connected successfully
```

### 5. Configure Frontend

Frontend `.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

### 6. Install Frontend Dependencies

```bash
npm install
```

### 7. Start Frontend

```bash
npm run dev
```

Frontend will run on: http://localhost:5173

### 8. Login

Default credentials:
- **Email**: admin@example.com
- **Password**: admin123

**⚠️ IMPORTANT: Change this password immediately in production!**

## Production Deployment

### Ubuntu Server Setup

1. **Install Dependencies**

```bash
sudo apt update
sudo apt install -y nodejs npm mysql-server nginx
```

2. **Setup MySQL**

```bash
sudo mysql
CREATE DATABASE isp_noc;
CREATE USER 'isp_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON isp_noc.* TO 'isp_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

mysql -u isp_user -p isp_noc < server/database/schema.sql
```

3. **Configure Backend**

```bash
cd /opt/isp-noc/server
cp .env.example .env
nano .env
```

4. **Install PM2**

```bash
sudo npm install -g pm2
```

5. **Start Backend with PM2**

```bash
cd /opt/isp-noc/server
pm2 start server.js --name isp-noc-api
pm2 save
pm2 startup
```

6. **Build Frontend**

```bash
cd /opt/isp-noc
npm run build
```

7. **Configure Nginx**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /opt/isp-noc/dist;
    index index.html;

    # Frontend
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
    }
}
```

8. **Enable Site**

```bash
sudo ln -s /etc/nginx/sites-available/isp-noc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

9. **Setup SSL (Optional but Recommended)**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/me` | Get current user |

**Login Request:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Login Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "email": "admin@example.com",
    "name": "Admin",
    "role": "admin"
  }
}
```

### Resources

All resource endpoints require authentication header:
```
Authorization: Bearer <jwt_token>
```

| Resource | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| `/api/pops` | ✅ | ✅ | ✅ /:id | ✅ /:id |
| `/api/equipment` | ✅ | ✅ | ✅ /:id | ✅ /:id |
| `/api/vlans` | ✅ | ✅ | ✅ /:id | ✅ /:id |
| `/api/circuits` | ✅ | ✅ | ✅ /:id | ✅ /:id |
| `/api/interfaces` | ✅ | ✅ | ✅ /:id | ✅ /:id |
| `/api/services` | ✅ | ✅ | ✅ /:id | ✅ /:id |
| `/api/runbooks` | ✅ | ✅ | ✅ /:id | ✅ /:id |
| `/api/checklists` | ✅ | ✅ | ✅ /:id | ✅ /:id |
| `/api/users` | ✅ (admin) | ✅ (admin) | ✅ /:id (admin) | ✅ /:id (admin) |
| `/api/audit` | ✅ (admin) | - | - | - |

## Frontend API Client

The frontend uses a centralized API client located at `src/lib/api.ts`:

```typescript
import { api, auth } from './lib/api';

// Authentication
await auth.login(email, password);
await auth.logout();
const user = await auth.getCurrentUser();

// CRUD Operations
const items = await api.get('/equipment');
const newItem = await api.post('/equipment', data);
const updated = await api.put('/equipment/123', data);
await api.delete('/equipment/123');
```

### Features

- ✅ JWT token management (localStorage)
- ✅ Automatic token attachment to requests
- ✅ Auto-redirect on 401 (unauthorized)
- ✅ Centralized error handling
- ✅ TypeScript support

## Security

### Authentication Flow

1. User logs in with email/password
2. Backend verifies credentials (bcrypt)
3. Backend generates JWT token
4. Frontend stores token in localStorage
5. All subsequent requests include: `Authorization: Bearer <token>`
6. Backend validates JWT on each request
7. On 401, frontend auto-redirects to login

### Password Requirements

- Minimum 6 characters (configurable)
- Stored as bcrypt hash in database
- JWT tokens expire (configurable)

### Role-Based Access Control

- **admin**: Full access to all features
- **noc**: Access to network operations
- **field_tech**: Limited access for field work
- **viewer**: Read-only access

## Monitoring

### Backend Logs

```bash
# View logs
pm2 logs isp-noc-api

# Restart backend
pm2 restart isp-noc-api

# Stop backend
pm2 stop isp-noc-api
```

### Nginx Logs

```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

### Database

```bash
mysql -u isp_user -p isp_noc

# View users
SELECT id, email, name, role FROM users;

# View audit logs
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;
```

## Troubleshooting

### Backend won't start

```bash
# Check if port 3001 is in use
sudo lsof -i :3001

# Check database connection
mysql -u isp_user -p isp_noc
```

### Frontend can't connect to API

1. Check backend is running: `curl http://localhost:3001/api/health`
2. Check VITE_API_URL in `.env`
3. Check browser console for errors
4. Check CORS settings in backend

### Authentication issues

1. Clear localStorage: `localStorage.clear()`
2. Check JWT_SECRET matches between requests
3. Verify database has users
4. Check backend logs for auth errors

## Backup

### Database Backup

```bash
# Create backup
mysqldump -u isp_user -p isp_noc > backup_$(date +%Y%m%d).sql

# Restore backup
mysql -u isp_user -p isp_noc < backup_20240101.sql
```

### Application Backup

```bash
# Backup entire application
tar -czf isp-noc-backup.tar.gz /opt/isp-noc

# Exclude node_modules
tar -czf isp-noc-backup.tar.gz --exclude='node_modules' /opt/isp-noc
```

## Updates

### Backend Update

```bash
cd /opt/isp-noc
git pull  # or upload new files
cd server
npm install
pm2 restart isp-noc-api
```

### Frontend Update

```bash
cd /opt/isp-noc
git pull  # or upload new files
npm install
npm run build
# Nginx will serve the new dist/ automatically
```

## Support

For issues, check:
1. `TROUBLESHOOTING.md` - Common problems and solutions
2. Backend logs: `pm2 logs isp-noc-api`
3. Nginx logs: `/var/log/nginx/error.log`
4. Database logs: `/var/log/mysql/error.log`

---

**Status**: ✅ Production Ready
**Last Updated**: 2024
**Architecture**: Self-hosted, No external dependencies
