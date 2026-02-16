# Deploy em Ubuntu/Linux Server

Este guia mostra como fazer o deploy do ISP NOC System em um servidor Ubuntu/Linux.

## Pré-requisitos

- Ubuntu Server 20.04 LTS ou superior (ou qualquer distribuição Linux com systemd)
- Acesso root ou sudo
- Domínio apontando para o servidor (opcional, mas recomendado)
- Conta Supabase com o projeto configurado

## 1. Instalação do Node.js

```bash
# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

## 2. Instalação do Nginx

```bash
# Instalar Nginx
sudo apt update
sudo apt install -y nginx

# Iniciar e habilitar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 3. Preparar o Projeto

### Opção A: Usando Git

```bash
# Navegar para o diretório de aplicações
cd /var/www

# Clonar o repositório (substitua pela URL do seu repositório)
sudo git clone https://github.com/seu-usuario/isp-noc-system.git
cd isp-noc-system

# Instalar dependências
sudo npm install
```

### Opção B: Upload Manual

```bash
# Criar diretório
sudo mkdir -p /var/www/isp-noc-system
cd /var/www/isp-noc-system

# Fazer upload dos arquivos via SCP/SFTP
# No seu computador local:
# scp -r * usuario@servidor:/var/www/isp-noc-system/

# No servidor, instalar dependências
sudo npm install
```

## 4. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env
sudo nano /var/www/isp-noc-system/.env
```

Adicione as seguintes variáveis:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

## 5. Build da Aplicação

```bash
cd /var/www/isp-noc-system
sudo npm run build
```

O build criará uma pasta `dist/` com os arquivos estáticos otimizados.

## 6. Configurar Nginx

```bash
# Criar arquivo de configuração do site
sudo nano /etc/nginx/sites-available/isp-noc
```

Adicione a seguinte configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;  # Substitua pelo seu domínio ou IP

    root /var/www/isp-noc-system/dist;
    index index.html;

    # Logs
    access_log /var/log/nginx/isp-noc-access.log;
    error_log /var/log/nginx/isp-noc-error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - todas as rotas vão para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Habilitar o site:

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/isp-noc /etc/nginx/sites-enabled/

# Remover site padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

## 7. Configurar Firewall

```bash
# Permitir HTTP e HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## 8. Configurar HTTPS com Let's Encrypt (Recomendado)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com.br

# Renovação automática já está configurada via systemd timer
# Verificar status:
sudo systemctl status certbot.timer
```

## 9. Configurar PM2 para Deploy Automático (Opcional)

Se você quiser usar PM2 para gerenciar deploys e atualizações:

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Criar script de deploy
sudo nano /var/www/isp-noc-system/deploy.sh
```

Conteúdo do `deploy.sh`:

```bash
#!/bin/bash
cd /var/www/isp-noc-system
git pull origin main
npm install
npm run build
sudo systemctl reload nginx
echo "Deploy concluído em $(date)"
```

Tornar executável:

```bash
sudo chmod +x /var/www/isp-noc-system/deploy.sh
```

## 10. Permissões

```bash
# Ajustar proprietário dos arquivos
sudo chown -R www-data:www-data /var/www/isp-noc-system

# Permissões corretas
sudo chmod -R 755 /var/www/isp-noc-system
```

## 11. Configurar Banco de Dados Supabase

As migrations já devem estar aplicadas no seu projeto Supabase. Se não estiver:

1. Acesse o Dashboard do Supabase
2. Vá em "SQL Editor"
3. Execute os arquivos de migration da pasta `supabase/migrations/`

## 12. Criar Usuário Admin Inicial

Execute o script SQL no Supabase:

```sql
-- Ver arquivo create-admin-user.sql na raiz do projeto
```

## Atualização do Sistema

Para atualizar o sistema após alterações:

```bash
cd /var/www/isp-noc-system
sudo git pull origin main  # Se usando Git
sudo npm install  # Instalar novas dependências se houver
sudo npm run build  # Rebuild
sudo systemctl reload nginx  # Recarregar Nginx
```

Ou simplesmente executar o script de deploy:

```bash
sudo /var/www/isp-noc-system/deploy.sh
```

## Monitoramento e Logs

### Ver logs do Nginx

```bash
# Logs de acesso
sudo tail -f /var/log/nginx/isp-noc-access.log

# Logs de erro
sudo tail -f /var/log/nginx/isp-noc-error.log
```

### Verificar status do Nginx

```bash
sudo systemctl status nginx
```

## Troubleshooting

### Problema: Site não carrega

```bash
# Verificar se Nginx está rodando
sudo systemctl status nginx

# Verificar configuração do Nginx
sudo nginx -t

# Ver logs de erro
sudo tail -n 50 /var/log/nginx/isp-noc-error.log
```

### Problema: Rotas do SPA retornam 404

Certifique-se de que o bloco `try_files` está correto no Nginx:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Problema: Build falha

```bash
# Limpar cache e node_modules
sudo rm -rf node_modules package-lock.json
sudo npm install
sudo npm run build
```

## Segurança Adicional

### 1. Configurar fail2ban (Opcional)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. Manter sistema atualizado

```bash
sudo apt update
sudo apt upgrade -y
```

### 3. Configurar backup automático

Crie um script de backup:

```bash
sudo nano /usr/local/bin/backup-isp-noc.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/isp-noc"
mkdir -p $BACKUP_DIR

# Backup dos arquivos
tar -czf $BACKUP_DIR/isp-noc-$DATE.tar.gz /var/www/isp-noc-system

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "isp-noc-*.tar.gz" -mtime +7 -delete

echo "Backup concluído: isp-noc-$DATE.tar.gz"
```

Tornar executável e agendar no cron:

```bash
sudo chmod +x /usr/local/bin/backup-isp-noc.sh
sudo crontab -e
```

Adicionar linha (backup diário às 2h da manhã):

```
0 2 * * * /usr/local/bin/backup-isp-noc.sh >> /var/log/backup-isp-noc.log 2>&1
```

## Recursos do Sistema

### Requisitos Mínimos

- CPU: 1 vCPU
- RAM: 1 GB
- Disco: 10 GB
- Banda: 100 Mbps

### Requisitos Recomendados

- CPU: 2 vCPUs
- RAM: 2 GB
- Disco: 20 GB SSD
- Banda: 1 Gbps

## Suporte

Para problemas ou dúvidas:
- Verifique os logs: `/var/log/nginx/`
- Consulte a documentação do Supabase
- Revise os arquivos de configuração

## Conclusão

Seu ISP NOC System agora está rodando em produção! Acesse via:
- HTTP: http://seu-dominio.com.br
- HTTPS: https://seu-dominio.com.br (se configurou SSL)

Credenciais padrão de acesso:
- Email: admin@admin.com
- Senha: Admin@123

**IMPORTANTE: Altere a senha padrão imediatamente após o primeiro login!**
