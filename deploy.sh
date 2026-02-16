#!/bin/bash

set -e

echo "=================================================="
echo "  ISP NOC Manager - Deploy Automático"
echo "=================================================="
echo ""

DEPLOY_MODE=${1:-"docker"}

if [ "$DEPLOY_MODE" = "docker" ]; then
    echo "🐳 Modo: Docker Compose"
    echo ""

    echo "📦 Verificando Docker..."
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker não encontrado! Instale o Docker primeiro."
        exit 1
    fi

    if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose não encontrado! Instale o Docker Compose primeiro."
        exit 1
    fi

    echo "✓ Docker instalado"
    echo ""

    echo "🏗️  Fazendo build do frontend..."
    npm install
    npm run build
    echo "✓ Build concluído"
    echo ""

    echo "🚀 Iniciando containers..."
    docker compose down 2>/dev/null || true
    docker compose up -d
    echo "✓ Containers iniciados"
    echo ""

    echo "⏳ Aguardando backend inicializar..."
    sleep 5

    echo ""
    echo "✅ Deploy concluído com sucesso!"
    echo ""
    echo "📍 Acesse o sistema:"
    echo "   → Frontend: http://localhost"
    echo "   → API: http://localhost:3001/api/health"
    echo ""
    echo "🔐 Credenciais padrão:"
    echo "   Email: admin@ispnoc.local"
    echo "   Senha: Admin@123"
    echo ""
    echo "📊 Ver logs:"
    echo "   docker compose logs -f"
    echo ""
    echo "⛔ Parar:"
    echo "   docker compose down"
    echo ""

elif [ "$DEPLOY_MODE" = "local" ]; then
    echo "💻 Modo: Local (sem Docker)"
    echo ""

    echo "📦 Verificando Node.js..."
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js não encontrado! Instale o Node.js primeiro."
        exit 1
    fi
    echo "✓ Node.js instalado: $(node --version)"
    echo ""

    echo "📦 Instalando dependências do backend..."
    cd backend
    npm install
    echo "✓ Dependências instaladas"
    echo ""

    echo "🗄️  Inicializando banco de dados..."
    npm run init-db
    echo "✓ Banco inicializado"
    echo ""

    echo "🏗️  Fazendo build do frontend..."
    cd ..
    npm install
    npm run build
    echo "✓ Build concluído"
    echo ""

    echo "🚀 Iniciando backend em background..."
    cd backend
    nohup npm start > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    cd ..
    echo "✓ Backend iniciado (PID: $BACKEND_PID)"
    echo ""

    echo "⏳ Aguardando backend inicializar..."
    sleep 3

    echo "📦 Verificando Nginx..."
    if ! command -v nginx &> /dev/null; then
        echo "⚠️  Nginx não encontrado. Você precisará configurá-lo manualmente."
        echo "   Veja DEPLOY-UBUNTU.md para instruções completas"
    else
        echo "✓ Nginx instalado"
        echo "   Configure o Nginx conforme DEPLOY-UBUNTU.md"
    fi
    echo ""

    echo "✅ Deploy local concluído!"
    echo ""
    echo "📍 Backend rodando em:"
    echo "   → API: http://localhost:3001/api/health"
    echo "   → Logs: tail -f backend.log"
    echo ""
    echo "⚠️  Para servir o frontend:"
    echo "   1. Configure o Nginx conforme DEPLOY-UBUNTU.md, ou"
    echo "   2. Use: npx serve dist -l 5173"
    echo ""
    echo "🔐 Credenciais padrão:"
    echo "   Email: admin@ispnoc.local"
    echo "   Senha: Admin@123"
    echo ""
    echo "⛔ Parar backend:"
    echo "   kill \$(cat backend.pid) && rm backend.pid"
    echo ""

elif [ "$DEPLOY_MODE" = "systemd" ]; then
    echo "🐧 Modo: SystemD (Ubuntu/Debian)"
    echo ""

    if [ "$EUID" -ne 0 ]; then
        echo "❌ Este modo requer privilégios de root"
        echo "   Execute: sudo ./deploy.sh systemd"
        exit 1
    fi

    echo "📦 Instalando dependências do sistema..."
    apt update
    apt install -y nodejs npm nginx
    echo "✓ Dependências instaladas"
    echo ""

    echo "📦 Instalando dependências do backend..."
    cd backend
    npm install
    echo "✓ Dependências instaladas"
    echo ""

    echo "🗄️  Inicializando banco de dados..."
    npm run init-db
    echo "✓ Banco inicializado"
    cd ..
    echo ""

    echo "🏗️  Fazendo build do frontend..."
    npm install
    npm run build
    echo "✓ Build concluído"
    echo ""

    echo "📁 Copiando arquivos..."
    mkdir -p /var/www/isp-noc
    cp -r dist/* /var/www/isp-noc/
    cp -r backend /opt/isp-noc-backend
    echo "✓ Arquivos copiados"
    echo ""

    echo "⚙️  Configurando serviço SystemD..."
    cat > /etc/systemd/system/isp-noc-backend.service << 'EOF'
[Unit]
Description=ISP NOC Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/isp-noc-backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=DB_PATH=/opt/isp-noc-backend/data/ispnoc.db

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable isp-noc-backend
    systemctl start isp-noc-backend
    echo "✓ Serviço configurado e iniciado"
    echo ""

    echo "⚙️  Configurando Nginx..."
    cat > /etc/nginx/sites-available/isp-noc << 'EOF'
server {
    listen 80;
    server_name _;

    root /var/www/isp-noc;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

    ln -sf /etc/nginx/sites-available/isp-noc /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    echo "✓ Nginx configurado"
    echo ""

    echo "✅ Deploy SystemD concluído!"
    echo ""
    echo "📍 Sistema disponível em:"
    echo "   → http://seu-servidor"
    echo ""
    echo "🔐 Credenciais padrão:"
    echo "   Email: admin@ispnoc.local"
    echo "   Senha: Admin@123"
    echo ""
    echo "📊 Gerenciar serviço:"
    echo "   systemctl status isp-noc-backend"
    echo "   systemctl restart isp-noc-backend"
    echo "   journalctl -u isp-noc-backend -f"
    echo ""

else
    echo "❌ Modo de deploy inválido!"
    echo ""
    echo "Uso: ./deploy.sh [modo]"
    echo ""
    echo "Modos disponíveis:"
    echo "  docker    - Deploy com Docker Compose (padrão)"
    echo "  local     - Deploy local sem Docker"
    echo "  systemd   - Deploy com SystemD (requer root)"
    echo ""
    echo "Exemplos:"
    echo "  ./deploy.sh"
    echo "  ./deploy.sh docker"
    echo "  ./deploy.sh local"
    echo "  sudo ./deploy.sh systemd"
    echo ""
    exit 1
fi
