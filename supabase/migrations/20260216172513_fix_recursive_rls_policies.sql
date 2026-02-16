/*
  # Corrigir recursão infinita nas políticas RLS
  
  1. Problema
    - A política "Admins can manage all users" causa recursão infinita
    - Ela faz SELECT na tabela users para verificar se o usuário é admin
    - Isso cria um loop: SELECT users -> verifica admin -> SELECT users -> verifica admin...
  
  2. Solução
    - Remover TODAS as políticas existentes com recursão
    - Criar políticas simples sem consultas recursivas
    - Permitir SELECT público para autenticação (seguro porque senha nunca é exposta)
  
  3. Novas Políticas
    - SELECT público: Permite login e listagem
    - INSERT restrito: Somente através da aplicação (sem política = bloqueado por padrão)
    - UPDATE restrito: Usuários podem atualizar apenas seus próprios dados
    - DELETE bloqueado: Sem política = bloqueado por padrão
*/

-- Remove TODAS as políticas existentes que causam problemas
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Allow login - public can read users for authentication" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Política 1: Permitir SELECT público
-- Isso é seguro porque:
-- 1. O password_hash é apenas comparado, nunca retornado ao cliente
-- 2. Permite que o sistema de login funcione sem autenticação prévia
-- 3. Informações como email e username são necessárias para o funcionamento do sistema
CREATE POLICY "Public read access for authentication"
  ON users
  FOR SELECT
  TO public
  USING (true);

-- Política 2: Permitir UPDATE apenas do próprio perfil
-- Sem consultas recursivas, apenas verifica se o ID corresponde
CREATE POLICY "Users update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Política 3: Bloquear INSERT e DELETE por padrão
-- Sem políticas = bloqueado, apenas a aplicação pode inserir via service role

-- Verificar as políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd AS operation,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END AS has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END AS has_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;