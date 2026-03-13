#!/bin/bash

set -e

echo "🔄 ISP NOC Manager - Atualização"
echo "=================================="
echo ""

MODE=${1:-"local"}

if [ "$MODE" = "docker" ]; then
    echo "🐳 Modo: Docker"
    echo ""

    echo "⏸️  Parando containers..."
    docker compose down
    echo "✓ Containers parados"
    echo ""

    echo "📦 Atualizando código..."
    git pull 2>/dev/null || echo "Não é um repositório Git"
    echo "✓ Código atualizado"
    echo ""

    echo "🏗️  Reconstruindo frontend..."
    npm install
    npm run build
    echo "✓ Build concluído"
    echo ""

    echo "🚀 Reiniciando containers..."
    docker compose up -d
    echo "✓ Containers iniciados"
    echo ""

    echo "✅ Atualização concluída!"
    echo ""

elif [ "$MODE" = "local" ]; then
    echo "💻 Modo: Local"
    echo ""

    echo "📦 Criando backup..."
    ./scripts/backup.sh
    echo ""

    if [ -f "backend.pid" ]; then
        echo "⏸️  Parando backend..."
        kill $(cat backend.pid) 2>/dev/null || true
        rm backend.pid
        sleep 2
        echo "✓ Backend parado"
        echo ""
    fi

    echo "📦 Atualizando código..."
    git pull 2>/dev/null || echo "Não é um repositório Git"
    echo "✓ Código atualizado"
    echo ""

    echo "📦 Atualizando dependências do backend..."
    cd backend
    npm install
    cd ..
    echo "✓ Dependências atualizadas"
    echo ""

    echo "🏗️  Reconstruindo frontend..."
    npm install
    npm run build
    echo "✓ Build concluído"
    echo ""

    echo "🚀 Reiniciando backend..."
    cd backend
    nohup npm start > ../backend.log 2>&1 &
    echo $! > ../backend.pid
    cd ..
    echo "✓ Backend iniciado"
    echo ""

    if command -v nginx &> /dev/null; then
        echo "🔄 Recarregando Nginx..."
        sudo nginx -t && sudo systemctl reload nginx
        echo "✓ Nginx recarregado"
        echo ""
    fi

    echo "✅ Atualização concluída!"
    echo ""

elif [ "$MODE" = "systemd" ]; then
    echo "🐧 Modo: SystemD"
    echo ""

    if [ "$EUID" -ne 0 ]; then
        echo "❌ Este modo requer privilégios de root"
        echo "   Execute: sudo ./scripts/update.sh systemd"
        exit 1
    fi

    echo "📦 Criando backup..."
    ./scripts/backup.sh
    echo ""

    echo "⏸️  Parando serviço..."
    systemctl stop isp-noc-backend
    echo "✓ Serviço parado"
    echo ""

    echo "📦 Atualizando código..."
    git pull 2>/dev/null || echo "Não é um repositório Git"
    echo "✓ Código atualizado"
    echo ""

    echo "📦 Atualizando dependências do backend..."
    cd backend
    npm install
    cd ..
    echo "✓ Dependências atualizadas"
    echo ""

    echo "🏗️  Reconstruindo frontend..."
    npm install
    npm run build
    echo "✓ Build concluído"
    echo ""

    echo "📁 Copiando arquivos atualizados..."
    cp -r dist/* /var/www/isp-noc/
    cp -r backend/* /opt/isp-noc-backend/
    echo "✓ Arquivos copiados"
    echo ""

    echo "🚀 Reiniciando serviço..."
    systemctl start isp-noc-backend
    echo "✓ Serviço iniciado"
    echo ""

    echo "🔄 Recarregando Nginx..."
    nginx -t && systemctl reload nginx
    echo "✓ Nginx recarregado"
    echo ""

    echo "✅ Atualização concluída!"
    echo ""

else
    echo "❌ Modo inválido: $MODE"
    echo ""
    echo "Uso: ./scripts/update.sh [modo]"
    echo ""
    echo "Modos:"
    echo "  docker    - Atualizar containers Docker"
    echo "  local     - Atualizar instalação local"
    echo "  systemd   - Atualizar instalação SystemD (requer root)"
    echo ""
    exit 1
fi
