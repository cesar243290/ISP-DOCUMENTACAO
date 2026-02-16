# 🚀 Guia Rápido - ISP NOC System

## Problema: "Credenciais inválidas" ao tentar logar?

### ✅ SOLUÇÃO RÁPIDA (3 minutos)

#### Passo 1: Abra o Supabase Dashboard
1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral

#### Passo 2: Execute este SQL

Clique em **New Query** e cole este código:

```sql
-- Limpar e recriar usuário admin
DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = 'admin@admin.com');
DELETE FROM users WHERE email = 'admin@admin.com';

INSERT INTO users (
  id,
  email,
  username,
  password_hash,
  role,
  full_name,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'admin@admin.com',
  'admin',
  '$2b$10$HiUeDwSVaMWIJZSKqMRCv.7x9sFUMfkt2v8yUtLtwxwnXfI/KvoJ2',
  'ADMIN',
  'Administrador do Sistema',
  true,
  now(),
  now()
);

SELECT * FROM users WHERE email = 'admin@admin.com';
```

#### Passo 3: Clique em RUN

Você deve ver **1 linha** retornada com os dados do usuário admin.

#### Passo 4: Faça login

1. Abra o sistema: `http://localhost:5173`
2. Use estas credenciais:
   - **Email**: `admin@admin.com`
   - **Senha**: `Admin@123`

---

## 🔍 Ainda não funciona?

### 1. Limpe o cache do navegador
- Pressione `F12`
- Vá em **Application** → **Storage** → **Local Storage**
- Clique com botão direito e selecione **Clear**
- Recarregue a página (`Ctrl+R` ou `Cmd+R`)

### 2. Veja os logs no console
- Abra o Console (`F12` → Console)
- Tente fazer login
- Procure por mensagens como:
  - ✅ "Password verification result: true" → Senha correta!
  - ❌ "User not found" → Execute o SQL novamente
  - ❌ "Password verification result: false" → Execute o SQL novamente

### 3. Verifique o hash no banco
Execute este SQL para verificar:

```sql
SELECT
  email,
  LENGTH(password_hash) as hash_length,
  is_active
FROM users
WHERE email = 'admin@admin.com';
```

**Resultado esperado**: `hash_length = 60` e `is_active = true`

Se `hash_length` for diferente de 60, execute o SQL do Passo 2 novamente.

---

## 📚 Mais informações

- Para solução detalhada de problemas: veja **TROUBLESHOOTING.md**
- Para documentação completa: veja **README.md**

---

## ⚡ Comandos úteis

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Gerar novo hash de senha
node generate-hash.js
```

---

## ✅ Checklist de verificação

Antes de tentar logar, confirme:

- [ ] Executei o SQL no Supabase SQL Editor
- [ ] Vi 1 linha retornada com o usuário admin
- [ ] Limpei o cache do navegador (Local Storage)
- [ ] Estou usando email: `admin@admin.com`
- [ ] Estou usando senha: `Admin@123` (com A maiúsculo)
- [ ] O sistema está rodando em http://localhost:5173

---

## 🆘 Suporte

Se nada disso funcionou:

1. Abra o console do navegador (F12)
2. Copie TODOS os logs que aparecem ao tentar fazer login
3. Verifique se há erros em vermelho
4. Execute o diagnóstico completo em **TROUBLESHOOTING.md**
