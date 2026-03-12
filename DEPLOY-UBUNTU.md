# Deploy no Ubuntu Server com MySQL/MariaDB

Este guia mostra como fazer o deploy completo da aplicação em um Ubuntu Server usando MySQL ou MariaDB.

## Pré-requisitos

- Ubuntu Server 20.04 ou superior
- Acesso root ou sudo
- Domínio (opcional, mas recomendado)

## 1. Instalação do MySQL/MariaDB

### Opção A: MySQL

```bash
sudo apt update
sudo apt install mysql-server -y
sudo mysql_secure_installation
```

### Opção B: MariaDB (Recomendado)

```bash
sudo apt update
sudo apt install mariadb-server -y
sudo mysql_secure_installation
```

### Configurar o banco de dados

```bash
sudo mysql

# Dentro do MySQL/MariaDB:
CREATE DATABASE network_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'netmanager'@'localhost' IDENTIFIED BY 'sua_senha_forte_aqui';
GRANT ALL PRIVILEGES ON network_manager.* TO 'netmanager'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Importar o schema

```bash
mysql -u netmanager -p network_manager < /caminho/do/projeto/server/database/schema.sql
```

## 2. Instalação do Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
node --version
npm --version
```

## 3. Instalação do Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 4. Configuração do Projeto

### Copiar arquivos para o servidor

```bash
# No seu computador local:
scp -r seu-projeto/ usuario@seu-servidor:/var/www/network-manager/

# Ou use git:
cd /var/www
sudo git clone seu-repositorio network-manager
cd network-manager
```

### Instalar dependências do backend

```bash
cd /var/www/network-manager/server
npm install
```

### Configurar variáveis de ambiente do backend

```bash
cd /var/www/network-manager/server
cp .env.example .env
nano .env
```

Configure com seus valores:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=netmanager
DB_PASSWORD=sua_senha_forte_aqui
DB_NAME=network_manager
JWT_SECRET=gere_uma_chave_secreta_forte_aqui
ENCRYPTION_KEY=gere_uma_chave_de_32_caracteres_aqui
```

Para gerar chaves seguras:

```bash
# JWT Secret
openssl rand -base64 32

# Encryption Key
openssl rand -base64 32
```

### Instalar dependências do frontend

```bash
cd /var/www/network-manager
npm install
```

### Configurar variáveis de ambiente do frontend

```bash
nano .env
```

Configure:

```env
VITE_API_URL=http://seu-dominio.com/api
```

Se estiver usando apenas IP:

```env
VITE_API_URL=http://SEU_IP:3001/api
```

### Build do frontend

```bash
cd /var/www/network-manager
npm run build
```

## 5. Configurar PM2 para o Backend

PM2 mantém o backend rodando continuamente:

```bash
sudo npm install -g pm2
cd /var/www/network-manager/server
pm2 start server.js --name network-manager-api
pm2 save
pm2 startup
```

Verificar status:

```bash
pm2 status
pm2 logs network-manager-api
```

## 6. Configurar Nginx

### Criar arquivo de configuração

```bash
sudo nano /etc/nginx/sites-available/network-manager
```

Cole esta configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        root /var/www/network-manager/dist;
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

### Ativar o site

```bash
sudo ln -s /etc/nginx/sites-available/network-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Configurar Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## 8. Configurar SSL com Let's Encrypt (Recomendado)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seu-dominio.com
```

O Certbot vai automaticamente configurar HTTPS.

## 9. Criar Usuário Admin

Execute o schema SQL que já inclui o usuário admin padrão.

**Login padrão**:
- Email: admin@example.com
- Senha: admin123

**IMPORTANTE**: Troque a senha no primeiro login!

## 10. Verificação Final

### Testar o backend

```bash
curl http://localhost:3001/health
```

Deve retornar: `{"status":"ok","timestamp":"..."}`

### Testar o frontend

Abra no navegador: `http://seu-dominio.com` ou `http://SEU_IP`

### Verificar logs

```bash
# Logs do backend
pm2 logs network-manager-api

# Logs do Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Logs do MySQL
sudo tail -f /var/log/mysql/error.log
```

## 11. Manutenção

### Atualizar a aplicação

```bash
cd /var/www/network-manager
git pull
npm install
npm run build
cd server
npm install
pm2 restart network-manager-api
```

### Backup do banco de dados

```bash
mysqldump -u netmanager -p network_manager > backup_$(date +%Y%m%d).sql
```

### Restaurar backup

```bash
mysql -u netmanager -p network_manager < backup_20260312.sql
```

### Reiniciar serviços

```bash
pm2 restart network-manager-api
sudo systemctl restart nginx
sudo systemctl restart mysql
```

## 12. Troubleshooting

### Backend não inicia

```bash
pm2 logs network-manager-api
```

### Erro de conexão com banco

```bash
mysql -u netmanager -p network_manager
sudo systemctl status mysql
```

### Frontend não carrega

```bash
ls -la /var/www/network-manager/dist
sudo chown -R www-data:www-data /var/www/network-manager/dist
```

### Erro 502 Bad Gateway

```bash
pm2 status
curl http://localhost:3001/health
pm2 restart network-manager-api
```

## Segurança Adicional

### Firewall avançado

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Fail2ban para proteção

```bash
sudo apt install fail2ban -y
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### Atualizações automáticas

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

## Performance

### Otimizar MySQL

Edite `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
max_connections = 100
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
query_cache_size = 16M
```

```bash
sudo systemctl restart mysql
```

### Cache do Nginx

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

**Sistema rodando no Ubuntu Server com MySQL/MariaDB!**
