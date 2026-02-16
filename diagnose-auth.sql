-- ========================================
-- DIAGNÓSTICO DE AUTENTICAÇÃO
-- ========================================
-- Execute este script para diagnosticar problemas de login

-- 1. Verificar se o usuário admin existe
SELECT
  id,
  email,
  username,
  role,
  full_name,
  is_active,
  created_at,
  LENGTH(password_hash) as hash_length,
  SUBSTRING(password_hash, 1, 10) as hash_preview
FROM users
WHERE email = 'admin@admin.com';

-- 2. Contar total de usuários
SELECT COUNT(*) as total_users FROM users;

-- 3. Verificar todos os usuários
SELECT
  id,
  email,
  username,
  role,
  is_active
FROM users;
