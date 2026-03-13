# Checklist - Deploy ISP NOC Manager (Sistema Local)

## ✅ Pré-Deploy

### Servidor
- [ ] Ubuntu Server 20.04+ instalado
- [ ] Acesso SSH funcionando
- [ ] Usuário com privilégios sudo
- [ ] Servidor atualizado (`sudo apt update && sudo apt upgrade`)

### Requisitos de Software
- [ ] Node.js 20+ instalado
- [ ] npm instalado
- [ ] Nginx instalado (opcional para produção)
- [ ] Git instalado (opcional)

### Networking
- [ ] Porta 80 (HTTP) disponível
- [ ] Porta 443 (HTTPS) disponível (se SSL)
- [ ] Porta 3001 (API) disponível
- [ ] Firewall configurado

## ✅ Instalação

### Opção A: Docker
- [ ] Docker instalado
- [ ] Docker Compose instalado
- [ ] Script deploy.sh executável (`chmod +x deploy.sh`)
- [ ] Executado `./deploy.sh docker`
- [ ] Containers rodando (`docker compose ps`)
- [ ] Backend health check ok (`curl http://localhost:3001/api/health`)

### Opção B: Local
- [ ] Dependências do backend instaladas (`cd backend && npm install`)
- [ ] Banco de dados inicializado (`npm run init-db`)
- [ ] Backend iniciado (`npm start`)
- [ ] Dependências do frontend instaladas (`npm install`)
- [ ] Frontend buildado (`npm run build`)
- [ ] Nginx configurado (ou usando outro servidor)

### Opção C: SystemD
- [ ] Script deploy.sh executável
- [ ] Executado `sudo ./deploy.sh systemd`
- [ ] Serviço SystemD ativo (`systemctl status isp-noc-backend`)
- [ ] Nginx configurado e rodando
- [ ] Health check ok

## ✅ Configuração

### Backend
- [ ] Arquivo `backend/.env` criado
- [ ] `JWT_SECRET` alterado para valor seguro
- [ ] `PORT` configurada (padrão 3001)
- [ ] `DB_PATH` configurado
- [ ] `CORS_ORIGIN` configurado

### Frontend
- [ ] Arquivo `.env` criado
- [ ] `VITE_API_URL` configurada corretamente
- [ ] Build executado com sucesso

### Nginx
- [ ] Arquivo de configuração criado em `/etc/nginx/sites-available/`
- [ ] Symlink criado em `/etc/nginx/sites-enabled/`
- [ ] Configuração testada (`nginx -t`)
- [ ] Nginx recarregado (`systemctl reload nginx`)
- [ ] Proxy /api/ funcionando

## ✅ Segurança

### Autenticação
- [ ] Login testado com credenciais padrão
- [ ] Senha padrão alterada imediatamente
- [ ] Novos usuários criados (se necessário)
- [ ] Roles configurados corretamente

### Sistema
- [ ] Firewall UFW ativado
- [ ] Portas necessárias abertas (22, 80, 443)
- [ ] Portas desnecessárias fechadas
- [ ] SSH com chave pública (sem senha)
- [ ] Fail2Ban instalado e configurado
- [ ] Atualizações automáticas configuradas

### SSL/HTTPS
- [ ] Certbot instalado
- [ ] Certificado SSL obtido
- [ ] HTTPS funcionando
- [ ] HTTP redirecionando para HTTPS
- [ ] Renovação automática testada

### Banco de Dados
- [ ] Arquivo SQLite com permissões corretas
- [ ] Backup inicial criado
- [ ] Diretório de backups criado
- [ ] Script de backup testado

## ✅ Backup

### Configuração
- [ ] Script `scripts/backup.sh` executável
- [ ] Backup manual testado (`./scripts/backup.sh`)
- [ ] Diretório de backups criado (default: `./backups`)
- [ ] Cron job configurado (backup diário)
- [ ] Retenção configurada (default: 7 dias)

### Teste
- [ ] Backup criado com sucesso
- [ ] Arquivo de backup verificado
- [ ] Restauração testada

## ✅ Testes

### Backend
- [ ] Health check responde ok (`/api/health`)
- [ ] Login funciona (`POST /api/auth/login`)
- [ ] Logout funciona (`POST /api/auth/logout`)
- [ ] CRUD de POPs funciona
- [ ] CRUD de Equipamentos funciona
- [ ] API protegida por autenticação
- [ ] Logs de auditoria sendo gerados

### Frontend
- [ ] Página de login carrega
- [ ] Login bem-sucedido
- [ ] Dashboard carrega
- [ ] Navegação entre páginas funciona
- [ ] Logout funciona
- [ ] Todas as páginas carregam sem erros

### Integração
- [ ] Frontend comunica com backend
- [ ] Autenticação JWT funciona
- [ ] Refresh de página mantém sessão
- [ ] Logout limpa sessão

## ✅ Monitoramento

### Logs
- [ ] Logs do backend acessíveis
- [ ] Logs do Nginx acessíveis
- [ ] Logs de auditoria sendo salvos
- [ ] Rotação de logs configurada

### Health Checks
- [ ] Backend health endpoint funcionando
- [ ] Script de monitoramento criado (opcional)
- [ ] Alertas configurados (opcional)

## ✅ Documentação

### Para Equipe
- [ ] README.md lido e compreendido
- [ ] DEPLOY-LOCAL.md disponível
- [ ] QUICK-START-LOCAL.md disponível
- [ ] backend/README.md disponível
- [ ] Credenciais documentadas de forma segura

### Procedimentos
- [ ] Procedimento de backup documentado
- [ ] Procedimento de restauração documentado
- [ ] Procedimento de atualização documentado
- [ ] Procedimento de troubleshooting disponível

## ✅ Produção

### Performance
- [ ] Tempo de resposta da API < 200ms
- [ ] Frontend carrega < 3s
- [ ] Banco SQLite adequado para carga esperada

### Capacidade
- [ ] Recursos do servidor adequados
- [ ] Espaço em disco monitorado
- [ ] RAM monitorada
- [ ] CPU monitorada

### Disponibilidade
- [ ] Sistema acessível externamente (se aplicável)
- [ ] DNS configurado (se aplicável)
- [ ] Uptime monitorado (opcional)

## ✅ Pós-Deploy

### Validação Final
- [ ] Login com admin funcionando
- [ ] Criar novo POP
- [ ] Criar novo equipamento
- [ ] Criar nova interface
- [ ] Criar nova VLAN
- [ ] Visualizar auditoria
- [ ] Testar todos os módulos principais

### Treinamento
- [ ] Equipe treinada no uso do sistema
- [ ] Equipe sabe onde encontrar documentação
- [ ] Equipe sabe fazer backup
- [ ] Equipe sabe atualizar o sistema

### Manutenção
- [ ] Calendário de backups definido
- [ ] Calendário de atualizações definido
- [ ] Responsáveis definidos
- [ ] Procedimentos de emergência definidos

## 📊 Resumo

- **Método de Deploy**: [ ] Docker [ ] Local [ ] SystemD
- **Data de Deploy**: _______________
- **Versão**: _______________
- **Responsável**: _______________
- **Servidor**: _______________
- **URL**: _______________

## ⚠️ Itens Críticos (OBRIGATÓRIOS)

1. ✅ Senha padrão alterada
2. ✅ JWT_SECRET alterado
3. ✅ Backup configurado
4. ✅ Firewall ativo
5. ✅ SSL configurado (produção)
6. ✅ Sistema testado e funcionando

---

**Após completar todos os itens, o sistema está pronto para produção!**

Deploy realizado com sucesso em: _______________
