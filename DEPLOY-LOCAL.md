# Deploy Local - ISP NOC Manager

Sistema 100% local/offline com backend Node.js, SQLite e frontend Vite.

## Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│    Nginx     │────▶│   Backend   │
│  (Frontend) │     │ (Port 80/443)│     │  (Port 3001)│
└─────────────┘     └──────────────┘     └──────┬──────┘
                           │                     │
                           │                     ▼
                           │              ┌─────────────┐
                           │              │   SQLite    │
                           │              │  ispnoc.db  │
                           │              └─────────────┘
                           ▼
                    ┌──────────────┐
                    │ Static Files │
                    │    (dist/)   │
                    └──────────────┘
```

## Método 1: Deploy com Docker (Recomendado)

### Pré-requisitos
- Docker 20.10+
- Docker Compose 2.0+

### Deploy Rápido

```bash
# 1. Tornar script executável
chmod +x deploy.sh

# 2. Deploy completo
./deploy.sh docker
```

Pronto! Sistema disponível em `http://localhost`

### Comandos úteis

```bash
# Ver logs
docker compose logs -f

# Parar sistema
docker compose down

# Restart
docker compose restart

# Backup do banco
docker compose exec backend cp /app/data/ispnoc.db /app/data/backup.db
```

## Método 2: Deploy Local (Sem Docker)

### Pré-requisitos
- Node.js 20+
- Nginx
- Ubuntu/Debian

### Instalação

```bash
# 1. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Instalar Nginx
sudo apt install -y nginx

# 3. Clonar/copiar projeto
cd /var/www
sudo git clone <repo-url> isp-noc
cd isp-noc

# 4. Deploy
chmod +x deploy.sh
./deploy.sh local
```

### Configuração Manual

Se preferir configurar manualmente:

#### Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar .env
cp .env.example .env
nano .env

# Inicializar banco
npm run init-db

# Iniciar (desenvolvimento)
npm start

# ou em produção com PM2
npm install -g pm2
pm2 start server.js --name isp-noc-backend
pm2 save
pm2 startup
```

#### Frontend

```bash
# No diretório raiz
npm install
npm run build

# Arquivos estarão em dist/
```

#### Nginx

```bash
sudo nano /etc/nginx/sites-available/isp-noc
```

Cole:

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/isp-noc/dist;
    index index.html;

    # Proxy para API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Ativar:

```bash
sudo ln -s /etc/nginx/sites-available/isp-noc /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## Método 3: Deploy com SystemD

### Deploy Automatizado

```bash
# Requer root
sudo ./deploy.sh systemd
```

Isso irá:
1. Instalar dependências do sistema
2. Configurar backend como serviço SystemD
3. Configurar Nginx
4. Iniciar tudo automaticamente

### Gerenciar Serviço

```bash
# Status
sudo systemctl status isp-noc-backend

# Logs
sudo journalctl -u isp-noc-backend -f

# Restart
sudo systemctl restart isp-noc-backend

# Stop
sudo systemctl stop isp-noc-backend

# Start
sudo systemctl start isp-noc-backend
```

## Configuração SSL (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com

# Renovação automática já está configurada
```

## Backup e Restauração

### Backup Automático

```bash
# Tornar executável
chmod +x scripts/backup.sh

# Executar backup
./scripts/backup.sh

# Agendar backup diário (crontab)
sudo crontab -e
# Adicione:
0 2 * * * cd /var/www/isp-noc && ./scripts/backup.sh
```

### Backup Manual

```bash
# Backup do banco SQLite
cp backend/data/ispnoc.db backend/data/ispnoc-backup-$(date +%Y%m%d).db
```

### Restauração

```bash
# Parar backend
sudo systemctl stop isp-noc-backend

# Restaurar banco
cp backend/data/ispnoc-backup-YYYYMMDD.db backend/data/ispnoc.db

# Reiniciar
sudo systemctl start isp-noc-backend
```

## Atualização do Sistema

### Atualização Automatizada

```bash
chmod +x scripts/update.sh

# Docker
./scripts/update.sh docker

# Local
./scripts/update.sh local

# SystemD
sudo ./scripts/update.sh systemd
```

### Atualização Manual

```bash
# 1. Backup
./scripts/backup.sh

# 2. Parar serviços
sudo systemctl stop isp-noc-backend

# 3. Atualizar código
git pull

# 4. Atualizar dependências
cd backend && npm install && cd ..
npm install

# 5. Rebuild frontend
npm run build

# 6. Copiar arquivos (se SystemD)
sudo cp -r dist/* /var/www/isp-noc/

# 7. Reiniciar
sudo systemctl start isp-noc-backend
sudo systemctl reload nginx
```

## Variáveis de Ambiente

### Backend (.env no /backend)

```env
PORT=3001
JWT_SECRET=troque-por-segredo-forte-aleatorio
NODE_ENV=production
DB_PATH=./data/ispnoc.db
CORS_ORIGIN=*
```

### Frontend (.env no raiz)

```env
VITE_API_URL=http://localhost:3001/api
```

Para produção com domínio:

```env
VITE_API_URL=https://seu-dominio.com/api
```

## Credenciais Padrão

- **Email**: admin@ispnoc.local
- **Senha**: Admin@123

**IMPORTANTE**: Altere a senha imediatamente após o primeiro login!

## Monitoramento

### Logs do Backend

```bash
# Local
tail -f backend.log

# SystemD
sudo journalctl -u isp-noc-backend -f

# Docker
docker compose logs -f backend
```

### Logs do Nginx

```bash
# Acesso
sudo tail -f /var/log/nginx/access.log

# Erros
sudo tail -f /var/log/nginx/error.log
```

### Health Check

```bash
# Backend
curl http://localhost:3001/api/health

# Completo
curl http://localhost/api/health
```

## Troubleshooting

### Backend não inicia

```bash
# Verificar logs
sudo journalctl -u isp-noc-backend -n 50

# Verificar porta
sudo netstat -tlnp | grep 3001

# Verificar permissões do banco
ls -la backend/data/
```

### Erro 502 Bad Gateway

```bash
# Backend não está rodando
sudo systemctl status isp-noc-backend

# Nginx não consegue conectar
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Banco de dados corrompido

```bash
# Restaurar backup
sudo systemctl stop isp-noc-backend
cp backend/data/ispnoc-backup-YYYYMMDD.db backend/data/ispnoc.db
sudo systemctl start isp-noc-backend
```

### Frontend não carrega

```bash
# Verificar build
ls -la dist/

# Rebuild
npm run build

# Verificar permissões
sudo chown -R www-data:www-data /var/www/isp-noc
```

## Firewall

```bash
# UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Verificar
sudo ufw status
```

## Performance

### Banco SQLite

O SQLite é adequado para:
- Até 50 usuários simultâneos
- Até 100.000 registros
- Ambientes de produção pequenos/médios

Para alta carga, considere migrar para PostgreSQL.

### Recursos Recomendados

- **Mínimo**: 1 CPU, 1GB RAM, 10GB disco
- **Recomendado**: 2 CPU, 2GB RAM, 20GB disco
- **Ideal**: 4 CPU, 4GB RAM, 50GB disco

## Segurança

### Checklist

- [ ] Alterar senha padrão do admin
- [ ] Alterar JWT_SECRET para valor aleatório forte
- [ ] Configurar SSL/HTTPS
- [ ] Configurar firewall
- [ ] Desabilitar acesso root SSH
- [ ] Configurar backups automáticos
- [ ] Atualizar sistema regularmente
- [ ] Monitorar logs de acesso

### Hardening

```bash
# Fail2Ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban

# Atualizações automáticas
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

## Suporte

- **Backend**: Ver `backend/README.md`
- **Troubleshooting**: Ver `TROUBLESHOOTING.md`
- **Logs**: `backend.log` ou `journalctl`

---

**Sistema 100% local e offline!** Sem dependências externas, sem custos de cloud, controle total dos seus dados.
