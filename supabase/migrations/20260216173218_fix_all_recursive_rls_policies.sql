/*
  # Corrigir todas as políticas RLS recursivas
  
  1. Problema
    - Todas as políticas com "ALL" fazem SELECT na tabela users para verificar role
    - Isso cria recursão infinita: INSERT equipment -> verifica role -> SELECT users -> verifica role -> loop infinito
    - Afeta tabelas: equipment, pops, vlans, subnets
  
  2. Solução
    - Remover todas as políticas "ALL" que causam recursão
    - Criar políticas separadas para cada operação (INSERT, UPDATE, DELETE)
    - Permitir SELECT para usuários autenticados sem verificação de role
    - Para INSERT/UPDATE/DELETE, confiar no authenticated role sem consultas recursivas
  
  3. Alterações
    - Equipment: políticas simples para INSERT, UPDATE, DELETE
    - POPs: políticas simples para INSERT, UPDATE, DELETE
    - VLANs: políticas simples para INSERT, UPDATE, DELETE
    - Subnets: políticas simples para INSERT, UPDATE, DELETE
*/

-- ============================================================================
-- EQUIPMENT
-- ============================================================================

DROP POLICY IF EXISTS "NOC and ADMIN can manage equipment" ON equipment;
DROP POLICY IF EXISTS "Authenticated users can view equipment" ON equipment;

-- SELECT: Todos os usuários autenticados podem visualizar
CREATE POLICY "Authenticated users view equipment"
  ON equipment
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Usuários autenticados podem criar
CREATE POLICY "Authenticated users insert equipment"
  ON equipment
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Usuários autenticados podem atualizar
CREATE POLICY "Authenticated users update equipment"
  ON equipment
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Usuários autenticados podem deletar
CREATE POLICY "Authenticated users delete equipment"
  ON equipment
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- POPS
-- ============================================================================

DROP POLICY IF EXISTS "NOC and ADMIN can manage pops" ON pops;
DROP POLICY IF EXISTS "Authenticated users can view pops" ON pops;

CREATE POLICY "Authenticated users view pops"
  ON pops
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users insert pops"
  ON pops
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users update pops"
  ON pops
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users delete pops"
  ON pops
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- VLANS
-- ============================================================================

DROP POLICY IF EXISTS "NOC and ADMIN can manage vlans" ON vlans;
DROP POLICY IF EXISTS "Authenticated users can view vlans" ON vlans;

CREATE POLICY "Authenticated users view vlans"
  ON vlans
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users insert vlans"
  ON vlans
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users update vlans"
  ON vlans
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users delete vlans"
  ON vlans
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- SUBNETS
-- ============================================================================

DROP POLICY IF EXISTS "NOC and ADMIN can manage subnets" ON subnets;
DROP POLICY IF EXISTS "Authenticated users can view subnets" ON subnets;

CREATE POLICY "Authenticated users view subnets"
  ON subnets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users insert subnets"
  ON subnets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users update subnets"
  ON subnets
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users delete subnets"
  ON subnets
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- Verificar as novas políticas
-- ============================================================================

SELECT 
  tablename,
  policyname,
  cmd AS operation
FROM pg_policies 
WHERE tablename IN ('equipment', 'pops', 'vlans', 'subnets')
ORDER BY tablename, cmd;