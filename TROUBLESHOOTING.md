# Guia de Solução de Problemas - Autenticação

## Problema: "Credenciais inválidas"

Se você está recebendo erro de "Credenciais inválidas", siga este guia passo a passo.

---

## SOLUÇÃO 1: Verificar se o usuário existe

### Passo 1: Execute o diagnóstico

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Cole este código:

```sql
-- Verificar se o usuário admin existe
SELECT
  id,
  email,
  username,
  role,
  is_active,
  LENGTH(password_hash) as hash_length
FROM users
WHERE email = 'admin@admin.com';
```

5. Clique em **Run**

### Resultado Esperado:

Você deve ver **1 linha** com:
- email: `admin@admin.com`
- username: `admin`
- role: `ADMIN`
- is_active: `true`
- hash_length: `60`

### Se NÃO retornar nenhuma linha:
O usuário não existe. Vá para **SOLUÇÃO 2**.

### Se retornar a linha mas hash_length for diferente de 60:
O hash está incorreto. Vá para **SOLUÇÃO 2**.

---

## SOLUÇÃO 2: Recriar o usuário admin

Execute este SQL no **Supabase Dashboard** → **SQL Editor**:

```sql
-- ========================================
-- RECRIAR USUÁRIO ADMIN
-- ========================================

-- 1. Deletar usuário admin se existir
DELETE FROM users WHERE email = 'admin@admin.com';

-- 2. Deletar todas as sessões antigas
DELETE FROM sessions;

-- 3. Criar usuário admin com hash correto
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

-- 4. Verificar se foi criado corretamente
SELECT
  id,
  email,
  username,
  role,
  is_active,
  LENGTH(password_hash) as hash_length,
  created_at
FROM users
WHERE email = 'admin@admin.com';
```

### Resultado Esperado:

Após executar, você deve ver **1 linha** com todos os dados do usuário e `hash_length = 60`.

---

## SOLUÇÃO 3: Verificar RLS (Row Level Security)

Se o usuário existe mas ainda não consegue logar, pode ser problema de RLS:

```sql
-- Verificar políticas RLS da tabela users
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users';
```

Se não retornar nenhuma política, execute:

```sql
-- Adicionar política temporária para debug
CREATE POLICY "Allow all access to users" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## SOLUÇÃO 4: Limpar cache do navegador

1. Abra o **Console do navegador** (F12)
2. Vá em **Application** → **Local Storage**
3. Delete a chave `session_token`
4. Recarregue a página (Ctrl+R)

---

## SOLUÇÃO 5: Ver logs no Console

1. Abra o **Console do navegador** (F12)
2. Clique em **Console**
3. Tente fazer login
4. Você verá logs como:
   - "Attempting login for: admin@admin.com"
   - "User query result: ..."
   - "Password verification result: ..."

### Possíveis mensagens e soluções:

#### "User not found or error"
→ Execute **SOLUÇÃO 2**

#### "Password verification result: false"
→ O hash está incorreto. Execute **SOLUÇÃO 2**

#### Erro de permissão do Supabase
→ Verifique RLS com **SOLUÇÃO 3**

---

## Credenciais Corretas

Após seguir as soluções acima, use:

- **Email**: `admin@admin.com`
- **Senha**: `Admin@123` (com A maiúsculo e @ e números)

---

## Ainda com problemas?

Execute este script completo de reset:

```sql
-- RESET COMPLETO DO SISTEMA DE AUTENTICAÇÃO

-- 1. Limpar tudo
DELETE FROM sessions;
DELETE FROM audit_logs WHERE entity_type = 'user';
DELETE FROM users;

-- 2. Recriar usuário admin
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

-- 3. Verificar
SELECT * FROM users WHERE email = 'admin@admin.com';
```

Depois:
1. Feche todas as abas do navegador
2. Abra uma nova aba
3. Acesse o sistema
4. Tente logar novamente

---

## Verificação Final

Execute este teste no SQL Editor:

```sql
-- Teste completo de autenticação
DO $$
DECLARE
  v_user_exists boolean;
  v_hash_length int;
BEGIN
  -- Verificar se usuário existe
  SELECT EXISTS(
    SELECT 1 FROM users WHERE email = 'admin@admin.com'
  ) INTO v_user_exists;

  -- Verificar tamanho do hash
  SELECT LENGTH(password_hash) INTO v_hash_length
  FROM users WHERE email = 'admin@admin.com';

  -- Resultado
  RAISE NOTICE 'Usuário existe: %', v_user_exists;
  RAISE NOTICE 'Tamanho do hash: %', v_hash_length;

  IF v_user_exists AND v_hash_length = 60 THEN
    RAISE NOTICE '✓ Tudo OK! Tente fazer login.';
  ELSE
    RAISE NOTICE '✗ Problema detectado. Execute SOLUÇÃO 2.';
  END IF;
END $$;
```

---

**Última atualização**: 2024
