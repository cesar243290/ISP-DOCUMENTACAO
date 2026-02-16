-- ========================================
-- CRIAR USUÁRIO ADMIN - ISP NOC SYSTEM
-- ========================================
-- Execute este script no Supabase SQL Editor
--
-- Credenciais:
-- Email: admin@admin.com
-- Senha: Admin@123
-- ========================================

-- PASSO 1: Limpar dados antigos
DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = 'admin@admin.com');
DELETE FROM users WHERE email = 'admin@admin.com';

-- PASSO 2: Criar usuário admin com hash correto
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

-- PASSO 3: Verificar se foi criado corretamente
SELECT
  id,
  email,
  username,
  role,
  full_name,
  is_active,
  LENGTH(password_hash) as hash_length,
  created_at
FROM users
WHERE email = 'admin@admin.com';

-- ========================================
-- RESULTADO ESPERADO:
-- 1 linha com:
--   - email: admin@admin.com
--   - username: admin
--   - role: ADMIN
--   - is_active: true
--   - hash_length: 60
-- ========================================
