# ISP NOC Backend - API Local

Backend Node.js com Express e SQLite para o ISP NOC Manager.

## Instalação Rápida

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env

# Inicializar banco de dados
npm run init-db

# Iniciar servidor
npm start
```

## Estrutura

```
backend/
├── data/
│   └── ispnoc.db          # Banco SQLite (criado automaticamente)
├── routes/
│   ├── auth.js            # Autenticação (login, logout)
│   ├── users.js           # Gestão de usuários
│   ├── pops.js            # POPs
│   ├── equipments.js      # Equipamentos
│   ├── interfaces.js      # Interfaces de rede
│   ├── vlans.js           # VLANs
│   ├── ipam.js            # Subnets e IPs
│   ├── circuits.js        # Circuitos
│   ├── services.js        # Serviços
│   ├── runbooks.js        # Documentação
│   ├── checklists.js      # Checklists
│   ├── audit.js           # Logs de auditoria
│   └── monitoring.js      # Monitoramento
├── middleware/
│   └── auth.js            # JWT e RBAC
├── schema.sql             # Schema do banco
├── init-db.js             # Script de inicialização
├── server.js              # Servidor Express
└── package.json
```

## Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuário atual
- `POST /api/auth/change-password` - Alterar senha

### Recursos (CRUD completo)
- `/api/users` - Usuários
- `/api/pops` - POPs
- `/api/equipments` - Equipamentos
- `/api/interfaces` - Interfaces
- `/api/vlans` - VLANs
- `/api/ipam/subnets` - Sub-redes
- `/api/ipam/allocations` - Alocações de IP
- `/api/circuits` - Circuitos
- `/api/services` - Serviços
- `/api/runbooks` - Runbooks
- `/api/checklists` - Checklists
- `/api/audit` - Auditoria
- `/api/monitoring` - Monitoramento

### Health Check
- `GET /api/health` - Status do servidor

## Variáveis de Ambiente

```env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
DB_PATH=./data/ispnoc.db
CORS_ORIGIN=http://localhost:5173
```

## Credenciais Padrão

- **Email**: admin@ispnoc.local
- **Senha**: Admin@123

## Desenvolvimento

```bash
# Modo watch (reinicia automaticamente)
npm run dev
```

## Produção

```bash
# Iniciar
npm start

# Com PM2
pm2 start server.js --name isp-noc-backend
pm2 save
pm2 startup
```

## Backup do Banco

```bash
# Copiar arquivo do banco
cp data/ispnoc.db data/ispnoc-backup-$(date +%Y%m%d).db
```

## Segurança

- JWT com expiração de 8 horas
- Senhas criptografadas com bcrypt
- RBAC com 5 roles
- Rate limiting (100 req/15min)
- Helmet.js para headers de segurança
- CORS configurável
- Auditoria completa de ações
