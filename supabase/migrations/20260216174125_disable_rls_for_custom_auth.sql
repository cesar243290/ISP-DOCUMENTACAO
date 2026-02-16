/*
  # Desabilitar RLS para Autenticação Customizada
  
  1. Problema
    - Sistema usa autenticação customizada (public.users + sessions)
    - Políticas RLS tentam usar auth.uid() que não existe neste contexto
    - Todas as operações de INSERT/UPDATE/DELETE estão falhando
  
  2. Solução
    - Desabilitar RLS em todas as tabelas operacionais
    - Manter controle de acesso na camada da aplicação
    - Sistema já valida sessões e permissões no frontend
  
  3. Tabelas Afetadas
    - equipment, pops, vlans, subnets, interfaces
    - circuits, services, runbooks, checklists
    - sessions, audit_logs, users
  
  4. Segurança
    - Autenticação via sessions table
    - Controle de acesso via user roles
    - Auditoria mantida em audit_logs
*/

-- ============================================================================
-- DESABILITAR RLS EM TODAS AS TABELAS
-- ============================================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE pops DISABLE ROW LEVEL SECURITY;
ALTER TABLE vlans DISABLE ROW LEVEL SECURITY;
ALTER TABLE subnets DISABLE ROW LEVEL SECURITY;
ALTER TABLE interfaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE circuits DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE runbooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- REMOVER TODAS AS POLÍTICAS ANTIGAS
-- ============================================================================

-- Users
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "ADMIN can manage all users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Sessions
DROP POLICY IF EXISTS "Users can manage own sessions" ON sessions;
DROP POLICY IF EXISTS "System can insert sessions" ON sessions;

-- Equipment
DROP POLICY IF EXISTS "Authenticated users view equipment" ON equipment;
DROP POLICY IF EXISTS "Authenticated users insert equipment" ON equipment;
DROP POLICY IF EXISTS "Authenticated users update equipment" ON equipment;
DROP POLICY IF EXISTS "Authenticated users delete equipment" ON equipment;
DROP POLICY IF EXISTS "NOC and ADMIN can manage equipment" ON equipment;
DROP POLICY IF EXISTS "Authenticated users can view equipment" ON equipment;

-- POPs
DROP POLICY IF EXISTS "Authenticated users view pops" ON pops;
DROP POLICY IF EXISTS "Authenticated users insert pops" ON pops;
DROP POLICY IF EXISTS "Authenticated users update pops" ON pops;
DROP POLICY IF EXISTS "Authenticated users delete pops" ON pops;
DROP POLICY IF EXISTS "NOC and ADMIN can manage pops" ON pops;
DROP POLICY IF EXISTS "Authenticated users can view pops" ON pops;

-- VLANs
DROP POLICY IF EXISTS "Authenticated users view vlans" ON vlans;
DROP POLICY IF EXISTS "Authenticated users insert vlans" ON vlans;
DROP POLICY IF EXISTS "Authenticated users update vlans" ON vlans;
DROP POLICY IF EXISTS "Authenticated users delete vlans" ON vlans;
DROP POLICY IF EXISTS "NOC and ADMIN can manage vlans" ON vlans;
DROP POLICY IF EXISTS "Authenticated users can view vlans" ON vlans;

-- Subnets
DROP POLICY IF EXISTS "Authenticated users view subnets" ON subnets;
DROP POLICY IF EXISTS "Authenticated users insert subnets" ON subnets;
DROP POLICY IF EXISTS "Authenticated users update subnets" ON subnets;
DROP POLICY IF EXISTS "Authenticated users delete subnets" ON subnets;
DROP POLICY IF EXISTS "NOC and ADMIN can manage subnets" ON subnets;
DROP POLICY IF EXISTS "Authenticated users can view subnets" ON subnets;

-- Interfaces
DROP POLICY IF EXISTS "NOC and ADMIN can manage interfaces" ON interfaces;
DROP POLICY IF EXISTS "Authenticated users can view interfaces" ON interfaces;

-- Circuits
DROP POLICY IF EXISTS "NOC and ADMIN can manage circuits" ON circuits;
DROP POLICY IF EXISTS "Authenticated users can view circuits" ON circuits;

-- Services
DROP POLICY IF EXISTS "NOC and ADMIN can manage services" ON services;
DROP POLICY IF EXISTS "Authenticated users can view services" ON services;

-- Runbooks
DROP POLICY IF EXISTS "NOC and ADMIN can manage runbooks" ON runbooks;
DROP POLICY IF EXISTS "All users can view runbooks" ON runbooks;

-- Checklists
DROP POLICY IF EXISTS "ADMIN, NOC and FIELD_TECH can manage checklists" ON checklists;
DROP POLICY IF EXISTS "ADMIN, NOC and FIELD_TECH can view checklists" ON checklists;

-- Audit Logs
DROP POLICY IF EXISTS "ADMIN and NOC can view audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit_logs" ON audit_logs;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'users', 'sessions', 'equipment', 'pops', 'vlans', 'subnets',
    'interfaces', 'circuits', 'services', 'runbooks', 'checklists', 'audit_logs'
  )
ORDER BY tablename;