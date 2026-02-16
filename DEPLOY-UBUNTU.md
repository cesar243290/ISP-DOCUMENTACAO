# Deploy no Ubuntu Server - Guia Completo

Este guia mostra como fazer o deploy do ISP NOC Manager em um servidor Ubuntu.

## Pré-requisitos

- Ubuntu Server 20.04 ou superior
- Acesso root ou sudo
- Domínio apontando para o IP do servidor (para SSL)
- Conta Supabase configurada

## Passo 1: Atualizar o Sistema

```bash
sudo apt update
sudo apt upgrade -y
```

## Passo 2: Instalar Node.js e NPM

```bash
# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version
npm --version
```

## Passo 3: Instalar Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

## Passo 4: Clonar o Projeto

```bash
# Criar diretório para o projeto
sudo mkdir -p /var/www/isp-noc
cd /var/www/isp-noc

# Se você tem o projeto em um repositório Git:
# git clone https://seu-repositorio.git .

# Caso contrário, transfira os arquivos via SCP:
# No seu computador local, execute:
# scp -r /caminho/do/projeto/* usuario@servidor:/var/www/isp-noc/
```

## Passo 5: Configurar Variáveis de Ambiente

```bash
cd /var/www/isp-noc

# Criar arquivo .env
sudo nano .env
```

Adicione as seguintes variáveis (substitua pelos seus valores do Supabase):

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

**IMPORTANTE**: Obtenha essas credenciais em:
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em Settings > API
4. Copie a URL e a anon/public key

## Passo 6: Instalar Dependências e Fazer Build

```bash
cd /var/www/isp-noc

# Instalar dependências
sudo npm install

# Fazer build do projeto
sudo npm run build
```

Isso criará uma pasta `dist` com os arquivos estáticos otimizados para produção.

## Passo 7: Configurar Nginx

```bash
# Criar configuração do site
sudo nano /etc/nginx/sites-available/isp-noc
```

Adicione a seguinte configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    root /var/www/isp-noc/dist;
    index index.html;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Disable access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

**Substitua** `seu-dominio.com` pelo seu domínio real.

Ativar o site:

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/isp-noc /etc/nginx/sites-enabled/

# Remover site padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

## Passo 8: Configurar Firewall

```bash
# Permitir SSH, HTTP e HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Passo 9: Instalar SSL com Let's Encrypt (Recomendado)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Certificado será renovado automaticamente
# Testar renovação automática:
sudo certbot renew --dry-run
```

Certbot configurará automaticamente o SSL no Nginx.

## Passo 10: Configurar Permissões

```bash
# Dar permissões corretas
sudo chown -R www-data:www-data /var/www/isp-noc
sudo chmod -R 755 /var/www/isp-noc
```

## Passo 11: Testar a Aplicação

Abra seu navegador e acesse:
- HTTP: `http://seu-dominio.com`
- HTTPS: `https://seu-dominio.com` (se configurou SSL)

Faça login com as credenciais:
- **Email**: admin@ispnoc.local
- **Senha**: Admin@123

**IMPORTANTE**: Altere a senha padrão imediatamente após o primeiro login!

## Atualização da Aplicação

Quando precisar atualizar o código:

```bash
cd /var/www/isp-noc

# Fazer backup do .env
cp .env .env.backup

# Atualizar código (se usar Git)
# git pull origin main

# Reinstalar dependências (se necessário)
sudo npm install

# Fazer novo build
sudo npm run build

# Restaurar .env se necessário
cp .env.backup .env

# Recarregar Nginx
sudo systemctl reload nginx
```

## Monitoramento de Logs

```bash
# Logs do Nginx - Acesso
sudo tail -f /var/log/nginx/access.log

# Logs do Nginx - Erros
sudo tail -f /var/log/nginx/error.log

# Verificar status do Nginx
sudo systemctl status nginx
```

## Troubleshooting

### Erro 502 Bad Gateway
```bash
sudo systemctl restart nginx
sudo nginx -t
```

### Erro 403 Forbidden
```bash
sudo chown -R www-data:www-data /var/www/isp-noc
sudo chmod -R 755 /var/www/isp-noc
```

### Páginas em branco ou erro ao carregar
- Verifique se o arquivo `.env` está configurado corretamente
- Verifique se as credenciais do Supabase estão corretas
- Abra o Console do navegador (F12) para ver erros JavaScript

### Build falha
```bash
# Limpar cache do npm
sudo npm cache clean --force

# Remover node_modules e reinstalar
sudo rm -rf node_modules package-lock.json
sudo npm install
sudo npm run build
```

## Segurança Adicional (Recomendado)

### 1. Instalar Fail2Ban (proteção contra brute force)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. Configurar atualizações automáticas

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 3. Desabilitar login root via SSH

```bash
sudo nano /etc/ssh/sshd_config
# Altere: PermitRootLogin no
sudo systemctl restart sshd
```

## Backup

É importante fazer backup regularmente:

```bash
# Criar script de backup
sudo nano /usr/local/bin/backup-isp-noc.sh
```

Adicione:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/isp-noc"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR

# Backup dos arquivos
tar -czf $BACKUP_DIR/isp-noc-$DATE.tar.gz /var/www/isp-noc

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "isp-noc-*.tar.gz" -mtime +7 -delete

echo "Backup concluído: $BACKUP_DIR/isp-noc-$DATE.tar.gz"
```

Tornar executável e agendar:

```bash
sudo chmod +x /usr/local/bin/backup-isp-noc.sh

# Agendar backup diário às 2h da manhã
sudo crontab -e
# Adicione a linha:
# 0 2 * * * /usr/local/bin/backup-isp-noc.sh
```

## Suporte

Para problemas com:
- **Supabase**: Verifique o dashboard em https://supabase.com/dashboard
- **Nginx**: `sudo nginx -t` para verificar erros de configuração
- **Aplicação**: Verifique o Console do navegador (F12)

## Checklist Final

- [ ] Node.js instalado (versão 20.x ou superior)
- [ ] Nginx instalado e rodando
- [ ] Projeto em `/var/www/isp-noc`
- [ ] Arquivo `.env` configurado com credenciais do Supabase
- [ ] Build executado com sucesso (`npm run build`)
- [ ] Configuração do Nginx criada e ativada
- [ ] Firewall configurado (portas 22, 80, 443)
- [ ] SSL configurado com Let's Encrypt
- [ ] Permissões corretas (www-data)
- [ ] Site acessível pelo navegador
- [ ] Login funcionando
- [ ] Senha padrão alterada

---

**Pronto!** Seu ISP NOC Manager está rodando em produção no Ubuntu Server.
