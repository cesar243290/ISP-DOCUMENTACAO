#!/bin/bash

# ISP NOC System - Script de Deploy
# Este script automatiza o processo de deploy em servidores Linux

set -e  # Sair em caso de erro

echo "==================================="
echo "ISP NOC System - Deploy Script"
echo "==================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para mensagens de sucesso
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Função para mensagens de erro
error() {
    echo -e "${RED}✗ $1${NC}"
}

# Função para mensagens de info
info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Verificar se está rodando como root
if [ "$EUID" -eq 0 ]; then
    info "Rodando como root"
else
    error "Por favor, rode este script com sudo"
    exit 1
fi

# 1. Atualizar código (se usando Git)
if [ -d ".git" ]; then
    info "Atualizando código do Git..."
    git pull origin main
    success "Código atualizado"
else
    info "Não é um repositório Git, pulando atualização..."
fi

# 2. Instalar/Atualizar dependências
info "Instalando/Atualizando dependências..."
npm install
success "Dependências instaladas"

# 3. Verificar se arquivo .env existe
if [ ! -f ".env" ]; then
    error "Arquivo .env não encontrado!"
    info "Crie o arquivo .env com as variáveis necessárias:"
    echo "  VITE_SUPABASE_URL=https://seu-projeto.supabase.co"
    echo "  VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica"
    exit 1
fi
success "Arquivo .env encontrado"

# 4. Build da aplicação
info "Fazendo build da aplicação..."
npm run build
success "Build concluído"

# 5. Ajustar permissões
info "Ajustando permissões..."
chown -R www-data:www-data dist/
chmod -R 755 dist/
success "Permissões ajustadas"

# 6. Recarregar Nginx (se estiver instalado)
if command -v nginx &> /dev/null; then
    info "Testando configuração do Nginx..."
    nginx -t

    info "Recarregando Nginx..."
    systemctl reload nginx
    success "Nginx recarregado"
else
    info "Nginx não encontrado, pulando..."
fi

echo ""
echo "==================================="
success "Deploy concluído com sucesso!"
echo "==================================="
echo ""
echo "Data: $(date)"
echo ""
