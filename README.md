# ISP NOC System

Sistema profissional de gestão de rede para ISP/NOC com inventário completo, documentação técnica e controle de acesso baseado em roles.

---

## ⚠️ PROBLEMAS COM LOGIN?

Se você está recebendo **"Credenciais inválidas"**, veja:
- 🚀 **[QUICK-START.md](./QUICK-START.md)** - Solução rápida em 3 minutos
- 🔧 **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Guia completo de solução de problemas

---

## 🚀 Funcionalidades

- **Inventário Completo**: Gestão de equipamentos (OLT, Switch, Router, Server, Firewall)
- **Infraestrutura Física**: POPs, Racks e cabeamento
- **Rede**: Interfaces, VLANs, IPAM (gestão de IPs e sub-redes)
- **Conectividade**: Gestão de circuitos e enlaces
- **Serviços**: PPPoE, RADIUS, DNS, DHCP, TR-069, etc
- **Documentação**: Runbooks e procedimentos técnicos
- **Operacional**: Checklists para manutenções e instalações
- **Segurança**:
  - Autenticação segura com sessões
  - RBAC (5 roles: ADMIN, NOC, NOC_READONLY, FIELD_TECH, VIEWER)
  - Vault de credenciais com criptografia AES-256-GCM
  - Auditoria completa de todas as ações
- **UI/UX**: Interface clean estilo Apple, totalmente responsiva

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase (já configurada neste projeto)

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone <repository-url>
cd isp-noc-system
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Variáveis de Ambiente

O arquivo `.env` já está configurado com as credenciais do Supabase:

```env
VITE_SUPABASE_URL=<sua-url-supabase>
VITE_SUPABASE_ANON_KEY=<sua-chave-anonima>
```

### 4. Database Setup

O schema do banco de dados já foi criado via migration no Supabase.

#### PASSO 1: Criar Usuário Admin (OBRIGATÓRIO)

1. Acesse o **Supabase Dashboard** → **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo do arquivo `create-admin-user.sql`
4. Clique em **Run** ou pressione `Ctrl+Enter`
5. Verifique se retornou 1 linha com o usuário criado

**IMPORTANTE**: Este passo cria o usuário admin com as credenciais corretas.

#### PASSO 2 (Opcional): Popular com Dados de Exemplo

Se desejar popular o banco com dados de exemplo (POPs, equipamentos, VLANs, etc):

1. No **SQL Editor** do Supabase
2. Abra uma nova query
3. Cole o conteúdo do arquivo `seed.sql`
4. Execute

### 5. Execute o projeto

```bash
npm run dev
```

O sistema estará disponível em `http://localhost:5173`

## 👤 Credenciais Padrão

Use estas credenciais para fazer login:

- **Email**: `admin@admin.com`
- **Senha**: `Admin@123`
- **Role**: ADMIN (acesso total)

## 🏗️ Estrutura do Projeto

```
isp-noc-system/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/             # Componentes UI (Button, Card, Modal, etc)
│   │   ├── Layout.tsx      # Layout principal com sidebar
│   │   └── ProtectedRoute.tsx
│   ├── contexts/           # Context API (AuthContext)
│   ├── lib/                # Utilitários
│   │   ├── supabase.ts    # Cliente Supabase
│   │   ├── auth.ts        # Funções de autenticação
│   │   ├── crypto.ts      # Criptografia AES-256-GCM
│   │   └── audit.ts       # Sistema de auditoria
│   ├── pages/              # Páginas da aplicação
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Equipments.tsx
│   │   ├── POPs.tsx
│   │   ├── VLANs.tsx
│   │   ├── Interfaces.tsx
│   │   ├── IPAM.tsx
│   │   ├── Circuits.tsx
│   │   ├── Services.tsx
│   │   ├── Runbooks.tsx
│   │   ├── Checklists.tsx
│   │   └── admin/
│   │       ├── Users.tsx
│   │       └── Audit.tsx
│   ├── types/              # TypeScript types
│   └── App.tsx             # Componente principal
├── seed.sql                # Script de seed data
└── README.md
```

## 🔐 Sistema de Roles (RBAC)

### ADMIN (Administrador)
- Acesso total ao sistema
- Gerenciar usuários
- Visualizar auditoria
- Gerenciar todos os módulos

### NOC (Operador)
- Criar/editar equipamentos
- Gerenciar objetos operacionais
- Visualizar auditoria
- Acessar vault de credenciais

### NOC_READONLY (Somente Leitura NOC)
- Visualizar todos os dados
- Sem permissão de edição

### FIELD_TECH (Técnico de Campo)
- Editar checklists
- Atualizar status de instalações
- Visualizar equipamentos e POPs

### VIEWER (Visualizador)
- Acesso básico de leitura
- Sem acesso a credenciais
- Sem acesso à auditoria

## 🛡️ Segurança

### Autenticação
- Senhas criptografadas com bcrypt
- Sessões seguras com tokens UUID
- Expiração automática de sessão (8 horas)
- Rate limiting no login

### Criptografia
- Credenciais armazenadas com AES-256-GCM
- Chave de criptografia em variável de ambiente
- Nunca expõe segredos em texto puro

### Auditoria
- Log completo de todas as ações
- Rastreamento de:
  - CREATE, UPDATE, DELETE
  - LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT
  - REVEAL_SECRET (quando alguém visualiza uma credencial)
- Armazena dados antes/depois
- IP e User Agent

### RLS (Row Level Security)
- Políticas restritivas no Supabase
- Acesso baseado em role do usuário
- Proteção a nível de banco de dados

## 📊 Módulos Principais

### Equipamentos
- Suporte para OLT, Switch, Router, Server, Firewall
- Configurações específicas por tipo
- Status e criticidade
- Associação com POPs e Racks

### IPAM
- Gestão de sub-redes (CIDR)
- Alocação de IPs
- Busca de IP (onde está usado)
- Suporte a VRF

### VLANs
- Registro centralizado de VLANs
- Tipos: PPPoE, TR-069, Management, IPTV, VoIP
- Escopo global ou local

### Interfaces
- Interfaces físicas, LAG, VLAN SVI, Loopback
- Status operacional
- Conexões entre equipamentos
- VLANs permitidas

### Circuitos
- Enlaces entre POPs
- Operadoras e SLA
- Capacidade e custos

### Serviços
- PPPoE, RADIUS, DNS, DHCP
- Associação com equipamentos
- Endpoints

### Runbooks
- Procedimentos em Markdown
- Categorias e tags
- Versionamento

### Checklists
- Listas de verificação operacionais
- Itens marcáveis
- Responsáveis e timestamps

## 🚀 Deploy em Produção

### Build Local

```bash
npm run build
```

Os arquivos de produção serão gerados na pasta `dist/`.

### Deploy no Ubuntu Server

Para fazer deploy completo em um servidor Ubuntu, consulte o guia detalhado:

📘 **[DEPLOY-UBUNTU.md](./DEPLOY-UBUNTU.md)** - Guia passo a passo completo

O guia inclui:
- Instalação do Node.js e Nginx
- Configuração de SSL com Let's Encrypt
- Setup de firewall e segurança
- Backup e monitoramento
- Troubleshooting

### Deploy no Netlify

Para deploy no Netlify, consulte:

📘 **[DEPLOY-NETLIFY.md](./DEPLOY-NETLIFY.md)** - Deploy com CI/CD automático

## 🎨 Customização

### Cores e Tema
Edite `tailwind.config.js` para customizar as cores principais.

### Logo
Substitua o ícone do servidor no componente de login e layout.

## 📝 Dados de Exemplo (Seed)

O seed inclui:
- 1 usuário admin
- 3 POPs (SP, RJ, MG)
- 4 equipamentos (OLT, Switch, Router, Server)
- Configurações específicas de cada equipamento
- Interfaces de rede
- 4 VLANs
- 4 Sub-redes
- 1 Circuito
- 3 Serviços
- 2 Runbooks

## 🔄 Integrações Futuras

Estrutura preparada para:
- Importação via CSV
- Integração com Zabbix
- Poll SNMP
- Backup automático de configs

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação técnica nos Runbooks do sistema.

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

**Desenvolvido para ISPs e NOCs profissionais** 🚀
