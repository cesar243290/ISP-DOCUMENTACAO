# ISP NOC Manager - Sistema 100% Local/Offline

Sistema completo de gerenciamento de NOC para provedores de internet, totalmente local e offline, sem dependências de serviços cloud.

## 🎯 Características Principais

### Sistema Local
- ✅ **100% Local/Offline** - Funciona sem internet
- ✅ **Sem Custos de Cloud** - Sem mensalidades
- ✅ **Controle Total** - Seus dados, seu servidor
- ✅ **Deploy Simples** - Um comando para subir tudo
- ✅ **Backup Fácil** - Arquivo SQLite único

### Tecnologias
- **Backend**: Node.js 20 + Express + SQLite
- **Frontend**: React 18 + TypeScript + Vite + Tailwind
- **Autenticação**: JWT + bcrypt
- **Banco de Dados**: SQLite (arquivo único)
- **Servidor**: Nginx (reverse proxy)

### Funcionalidades
- Inventário completo de equipamentos
- Gestão de POPs e infraestrutura
- IPAM (gestão de IPs e sub-redes)
- VLANs e interfaces de rede
- Circuitos e serviços
- Documentação (Runbooks)
- Checklists operacionais
- Sistema de monitoramento
- Auditoria completa de ações
- RBAC com 5 níveis de acesso

## 🚀 Quick Start

### Método 1: Docker (Recomendado)

```bash
chmod +x deploy.sh
./deploy.sh docker
```

Acesse: `http://localhost`

### Método 2: Local

```bash
./deploy.sh local
```

### Método 3: SystemD (Produção)

```bash
sudo ./deploy.sh systemd
```

## 📁 Estrutura do Projeto

```
isp-noc/
├── backend/                    # API Node.js
│   ├── data/                  # Banco SQLite
│   │   └── ispnoc.db         # Banco de dados
│   ├── routes/               # Endpoints da API
│   │   ├── auth.js          # Autenticação
│   │   ├── equipments.js    # Equipamentos
│   │   ├── pops.js          # POPs
│   │   ├── vlans.js         # VLANs
│   │   ├── ipam.js          # IPAM
│   │   └── ...              # Outros módulos
│   ├── middleware/          # JWT, RBAC
│   ├── schema.sql           # Schema do banco
│   ├── init-db.js           # Inicialização
│   ├── server.js            # Servidor Express
│   └── package.json
├── src/                      # Frontend React
│   ├── components/          # Componentes UI
│   ├── contexts/            # AuthContext (JWT)
│   ├── lib/
│   │   └── api.ts          # Cliente HTTP (fetch)
│   ├── pages/              # Páginas da aplicação
│   └── types/
├── scripts/
│   ├── backup.sh           # Backup do SQLite
│   └── update.sh           # Atualização do sistema
├── dist/                   # Build do frontend (gerado)
├── deploy.sh              # Script de deploy
├── docker-compose.yml     # Configuração Docker
├── nginx.conf             # Configuração Nginx
└── .env                   # Variáveis de ambiente
```

## 📖 Documentação

### Guias de Deploy
- 📘 **[QUICK-START-LOCAL.md](./QUICK-START-LOCAL.md)** - Start em 5 minutos
- 📘 **[DEPLOY-LOCAL.md](./DEPLOY-LOCAL.md)** - Guia completo de deploy
- 📘 **[CHECKLIST-DEPLOY.md](./CHECKLIST-DEPLOY.md)** - Checklist de validação

### Documentação Técnica
- 📘 **[backend/README.md](./backend/README.md)** - Documentação da API
- 📘 **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Solução de problemas

## 🔐 Segurança

### Autenticação
- JWT com expiração de 8 horas
- Senhas criptografadas com bcrypt (salt 10)
- Tokens armazenados em localStorage
- Logout limpa sessão no servidor

### RBAC (5 Roles)
1. **ADMIN** - Acesso total
2. **NOC** - Operador completo
3. **NOC_READONLY** - Apenas leitura
4. **FIELD_TECH** - Técnico de campo
5. **VIEWER** - Visualizador básico

### Auditoria
- Log completo de todas as ações
- CREATE, UPDATE, DELETE
- LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT
- IP e User Agent registrados

## 🔧 API REST

### Endpoints Principais

```
POST   /api/auth/login         # Login
POST   /api/auth/logout        # Logout
GET    /api/auth/me           # Usuário atual
GET    /api/health            # Health check

GET    /api/users             # Listar usuários
POST   /api/users             # Criar usuário

GET    /api/pops              # Listar POPs
POST   /api/pops              # Criar POP
PUT    /api/pops/:id          # Atualizar POP
DELETE /api/pops/:id          # Deletar POP

GET    /api/equipments        # Listar equipamentos
POST   /api/equipments        # Criar equipamento
PUT    /api/equipments/:id    # Atualizar equipamento
DELETE /api/equipments/:id    # Deletar equipamento

# ... e mais 10+ recursos
```

Ver documentação completa em `backend/README.md`

## 💾 Backup e Restauração

### Backup Automático

```bash
# Manual
./scripts/backup.sh

# Agendar (crontab)
0 2 * * * cd /var/www/isp-noc && ./scripts/backup.sh
```

### Restauração

```bash
# Parar backend
sudo systemctl stop isp-noc-backend

# Restaurar
cp backups/ispnoc-backup-YYYYMMDD.db backend/data/ispnoc.db

# Reiniciar
sudo systemctl start isp-noc-backend
```

## 🔄 Atualização

```bash
# Docker
./scripts/update.sh docker

# Local
./scripts/update.sh local

# SystemD
sudo ./scripts/update.sh systemd
```

## 🐳 Docker

### Serviços

```yaml
backend:   # Node.js + Express
  - Port: 3001
  - Volume: backend-data (SQLite)

frontend:  # Nginx + static files
  - Port: 80
  - Proxy: /api/ -> backend:3001
```

### Comandos

```bash
# Iniciar
docker compose up -d

# Parar
docker compose down

# Logs
docker compose logs -f

# Restart
docker compose restart

# Backup
docker compose exec backend cp /app/data/ispnoc.db /app/data/backup.db
```

## 🖥️ Requisitos de Sistema

### Mínimo
- CPU: 1 core
- RAM: 1GB
- Disco: 10GB
- OS: Ubuntu 20.04+

### Recomendado
- CPU: 2 cores
- RAM: 2GB
- Disco: 20GB
- OS: Ubuntu 22.04+

### Ideal
- CPU: 4 cores
- RAM: 4GB
- Disco: 50GB SSD
- OS: Ubuntu 22.04+ LTS

## 📊 Performance

### SQLite Adequado Para
- Até 50 usuários simultâneos
- Até 100.000 registros
- Ambientes pequenos/médios
- Leitura intensiva

### Migração para PostgreSQL
Se necessitar mais performance, o código está preparado para migração substituindo apenas o driver do banco.

## 🔐 Credenciais Padrão

```
Email: admin@ispnoc.local
Senha: Admin@123
```

**⚠️ IMPORTANTE**: Altere imediatamente após primeiro login!

## 🛠️ Desenvolvimento

### Backend

```bash
cd backend
npm install
npm run init-db
npm run dev    # Modo watch
```

### Frontend

```bash
npm install
npm run dev    # Vite dev server
```

### Build

```bash
npm run build
```

## 📝 Variáveis de Ambiente

### Backend (`backend/.env`)

```env
PORT=3001
JWT_SECRET=seu-segredo-super-forte-aqui
NODE_ENV=production
DB_PATH=./data/ispnoc.db
CORS_ORIGIN=*
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3001/api
```

## 🚨 Troubleshooting

### Backend não inicia

```bash
# Ver logs
sudo journalctl -u isp-noc-backend -n 50

# Verificar porta
sudo netstat -tlnp | grep 3001
```

### Erro 502 Bad Gateway

```bash
# Verificar backend
sudo systemctl status isp-noc-backend

# Verificar Nginx
sudo nginx -t
```

### Login não funciona

```bash
# Verificar banco
sqlite3 backend/data/ispnoc.db "SELECT * FROM users;"

# Reinicializar banco
cd backend
npm run init-db
```

Ver guia completo em `TROUBLESHOOTING.md`

## 📜 Licença

Proprietário - Todos os direitos reservados

## 🤝 Suporte

- 📘 Documentação completa nos arquivos `.md`
- 🐛 Issues: Reportar problemas
- 📧 Contato: [seu-email]

---

**Desenvolvido para ISPs que querem controle total dos seus dados**

Sistema 100% local, sem custos de cloud, deploy em 5 minutos.
