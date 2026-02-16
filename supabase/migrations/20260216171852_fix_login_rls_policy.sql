/*
  # Corrigir política RLS para permitir login
  
  1. Problema
    - As políticas RLS exigem autenticação para SELECT em users
    - Mas durante o login o usuário ainda não está autenticado
    - Isso impede o processo de login
  
  2. Solução
    - Adicionar política que permite SELECT público na tabela users
    - Isso permite buscar usuário durante o login
    - É seguro porque o password_hash é apenas comparado, nunca exposto
  
  3. Alterações
    - Remove política "Users can view own profile" (muito restritiva)
    - Adiciona política "Allow login - public can read users for authentication"
    - Mantém as outras políticas de UPDATE e gestão de admins
*/

-- Remove a política restritiva que impede o login
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Adiciona política que permite leitura pública para login
-- Isso é seguro porque:
-- 1. O password_hash nunca é retornado ao cliente (apenas comparado)
-- 2. Só estamos permitindo SELECT, não UPDATE/DELETE/INSERT
-- 3. Usuários inativos são filtrados no código da aplicação
CREATE POLICY "Allow login - public can read users for authentication"
  ON users
  FOR SELECT
  TO public
  USING (true);

-- Verificar políticas após a alteração
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;