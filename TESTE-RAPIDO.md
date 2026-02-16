# Teste Rápido - Validar Sistema Local

## ✅ Teste Local (Desenvolvimento)

### 1. Testar Backend

```bash
# Entrar no diretório do backend
cd backend

# Instalar dependências
npm install

# Inicializar banco de dados
npm run init-db

# Você deve ver:
# ✓ Conectado ao banco: ./data/ispnoc.db
# ✓ Usuário admin criado
# ✅ Banco de dados inicializado com sucesso!

# Iniciar backend
npm start

# Você deve ver:
# ✓ Conectado ao banco de dados
# 🚀 ISP NOC Backend rodando na porta 3001
```

**Em outro terminal**, testar API:

```bash
# Health check
curl http://localhost:3001/api/health

# Deve retornar:
# {"status":"ok","timestamp":"...","database":"connected","users":1}

# Testar login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ispnoc.local","password":"Admin@123"}'

# Deve retornar:
# {"token":"eyJ...","user":{"id":"...","email":"admin@ispnoc.local",...}}
```

### 2. Testar Frontend

```bash
# No diretório raiz do projeto
npm install

# Build do frontend
npm run build

# Deve gerar pasta dist/ com:
# - index.html
# - assets/*.css
# - assets/*.js

# Servir frontend
npx serve dist -l 5173

# Acessar: http://localhost:5173
```

### 3. Teste Completo (Frontend + Backend)

Com backend rodando (porta 3001) e frontend servido (porta 5173):

1. Abrir `http://localhost:5173`
2. Fazer login:
   - Email: `admin@ispnoc.local`
   - Senha: `Admin@123`
3. Deve redirecionar para Dashboard
4. Testar navegação entre páginas
5. Criar um POP de teste
6. Criar um equipamento de teste
7. Fazer logout

## ✅ Teste com Docker

```bash
# Build do frontend (necessário antes)
npm run build

# Iniciar containers
./deploy.sh docker

# Aguardar ~10 segundos

# Verificar containers
docker compose ps

# Deve mostrar:
# NAME                    STATUS
# isp-noc-backend        Up (healthy)
# isp-noc-frontend       Up

# Verificar logs
docker compose logs -f

# Acessar sistema
# http://localhost

# Testar health
curl http://localhost/api/health
```

## ✅ Teste SystemD (Ubuntu)

```bash
# Requer root
sudo ./deploy.sh systemd

# Verificar serviço
sudo systemctl status isp-noc-backend

# Deve mostrar:
# Active: active (running)

# Verificar Nginx
sudo systemctl status nginx

# Verificar site
curl http://localhost

# Deve retornar HTML do frontend

# Verificar API
curl http://localhost/api/health
```

## 🐛 Troubleshooting Rápido

### Backend não inicia

```bash
# Verificar se porta está em uso
sudo netstat -tlnp | grep 3001

# Verificar se banco foi inicializado
ls -la backend/data/

# Reinicializar banco
cd backend
rm -rf data/
npm run init-db
```

### Frontend não carrega

```bash
# Limpar e rebuild
rm -rf dist/
npm run build

# Verificar se dist/ foi criado
ls -la dist/
```

### Docker não funciona

```bash
# Verificar Docker
docker --version
docker compose version

# Parar tudo
docker compose down

# Limpar volumes (CUIDADO: apaga banco!)
docker compose down -v

# Rebuild
./deploy.sh docker
```

### Erro de login

```bash
# Verificar se admin existe
cd backend
sqlite3 data/ispnoc.db "SELECT * FROM users;"

# Recriar admin
sqlite3 data/ispnoc.db "DELETE FROM users;"
npm run init-db
```

## ✅ Checklist de Validação Rápida

### Backend
- [ ] `npm install` executa sem erros
- [ ] `npm run init-db` cria banco
- [ ] `npm start` inicia servidor
- [ ] `curl localhost:3001/api/health` responde OK
- [ ] Login via API funciona

### Frontend
- [ ] `npm install` executa sem erros
- [ ] `npm run build` gera dist/
- [ ] Arquivos estão em dist/
- [ ] Frontend abre no navegador
- [ ] Login funciona
- [ ] Dashboard carrega

### Docker
- [ ] Docker instalado
- [ ] `docker compose up` funciona
- [ ] Containers estão UP
- [ ] `curl localhost/api/health` responde
- [ ] Login funciona

### SystemD
- [ ] Script executa com sudo
- [ ] Serviço está Active
- [ ] Nginx está rodando
- [ ] Site carrega
- [ ] API responde
- [ ] Login funciona

## 📊 Resultado Esperado

Ao completar os testes:

1. ✅ Backend rodando na porta 3001
2. ✅ Frontend buildado em dist/
3. ✅ Banco SQLite criado e populado
4. ✅ API respondendo a requests
5. ✅ Login funcionando
6. ✅ Dashboard acessível
7. ✅ CRUD funcionando

## 🎉 Sucesso!

Se todos os testes passaram, o sistema está **100% funcional** e pronto para uso!

Próximos passos:
1. Ler **DEPLOY-LOCAL.md** para deploy em produção
2. Configurar backup automático
3. Alterar senha padrão
4. Criar usuários adicionais

---

**Sistema validado e funcionando!**
