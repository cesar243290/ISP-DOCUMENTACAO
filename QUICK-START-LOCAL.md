# Quick Start - Deploy Local em 5 Minutos

## Opção 1: Docker (Mais Rápido)

```bash
# 1. Tornar executável
chmod +x deploy.sh

# 2. Deploy completo
./deploy.sh docker

# 3. Acessar
# http://localhost
# Email: admin@ispnoc.local
# Senha: Admin@123
```

Pronto! O sistema está rodando.

## Opção 2: Local (Sem Docker)

### Pré-requisitos

```bash
# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx
```

### Deploy

```bash
# 1. Backend
cd backend
npm install
npm run init-db
npm start &

# 2. Frontend (nova aba/terminal)
cd ..
npm install
npm run build

# 3. Servir com Nginx ou:
npx serve dist -l 80
```

### Acessar

- Frontend: `http://localhost`
- API: `http://localhost:3001/api/health`
- Email: `admin@ispnoc.local`
- Senha: `Admin@123`

## Comandos Úteis

```bash
# Backup
./scripts/backup.sh

# Update
./scripts/update.sh docker   # ou local/systemd

# Logs (Docker)
docker compose logs -f

# Logs (Local)
tail -f backend.log

# Parar (Docker)
docker compose down

# Parar (Local)
kill $(cat backend.pid)
```

## Estrutura do Projeto

```
isp-noc/
├── backend/              # API Node.js + Express
│   ├── data/            # Banco SQLite
│   ├── routes/          # Endpoints da API
│   ├── server.js        # Servidor principal
│   └── schema.sql       # Schema do banco
├── src/                 # Frontend React
├── dist/                # Build (gerado)
├── scripts/             # Backup, update
├── deploy.sh            # Script de deploy
├── docker-compose.yml   # Docker config
└── nginx.conf           # Nginx config
```

## Tecnologias

- **Backend**: Node.js 20 + Express + SQLite + JWT
- **Frontend**: React 18 + TypeScript + Vite + Tailwind
- **Servidor**: Nginx (reverse proxy)
- **Deploy**: Docker ou SystemD

## Características

✅ 100% Local/Offline
✅ Sem dependências externas
✅ Sem custos de cloud
✅ Banco SQLite (arquivo único)
✅ Deploy com 1 comando
✅ Backup simples (copiar arquivo)
✅ JWT Authentication
✅ RBAC (5 roles)
✅ Auditoria completa
✅ API RESTful
✅ Documentação completa

## Guias Completos

- 📘 **DEPLOY-LOCAL.md** - Deploy detalhado com todas as opções
- 📘 **DEPLOY-UBUNTU.md** - Deploy em produção Ubuntu Server
- 📘 **backend/README.md** - Documentação da API
- 📘 **TROUBLESHOOTING.md** - Solução de problemas

## Próximos Passos

1. ✅ Fazer login e alterar senha padrão
2. ✅ Configurar backup automático
3. ✅ Configurar SSL (se produção)
4. ✅ Criar usuários adicionais
5. ✅ Importar dados iniciais

---

Pronto para usar! Sistema rodando 100% local.
