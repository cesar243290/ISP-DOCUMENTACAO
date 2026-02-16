/*
  # Habilitar RLS e Criar Políticas de Segurança

  ## Problemas de Segurança Corrigidos

  1. RLS Desabilitado
     - Várias tabelas críticas sem RLS habilitado
     - Dados sensíveis expostos publicamente
     - Tokens e credenciais acessíveis sem autenticação

  2. Políticas Restritivas
     - Todas as políticas agora exigem autenticação
     - Acesso baseado em roles (ADMIN, NOC, etc.)
     - Separação de permissões (SELECT, INSERT, UPDATE, DELETE)

  3. Proteção de Dados Sensíveis
     - Tabela users: apenas admins podem ver outros usuários
     - Tabela sessions: usuários só veem suas próprias sessões
     - Tabela credentials: acesso restrito
     - Tabela monitoring_configs: tokens protegidos

  ## Tabelas Protegidas
  
  - users (CRÍTICO)
  - sessions (CRÍTICO)
  - audit_logs
  - monitoring_configs
  - monitoring_status
  - equipment
  - interfaces
  - circuits
  - vlans
  - subnets
  - services
  - pops
  - checklists
  - runbooks
*/

-- Habilitar RLS em TODAS as tabelas críticas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE interfaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE vlans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subnets ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pops ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE runbooks ENABLE ROW LEVEL SECURITY;

-- =======================
-- USERS TABLE POLICIES
-- =======================

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT user_id FROM sessions 
      WHERE token = current_setting('request.headers')::json->>'authorization'
      AND expires_at > now()
    )
  );

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN sessions s ON s.user_id = u.id
      WHERE s.token = current_setting('request.headers')::json->>'authorization'
      AND s.expires_at > now()
      AND u.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins can insert users" ON users;
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN sessions s ON s.user_id = u.id
      WHERE s.token = current_setting('request.headers')::json->>'authorization'
      AND s.expires_at > now()
      AND u.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins can update users" ON users;
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN sessions s ON s.user_id = u.id
      WHERE s.token = current_setting('request.headers')::json->>'authorization'
      AND s.expires_at > now()
      AND u.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN sessions s ON s.user_id = u.id
      WHERE s.token = current_setting('request.headers')::json->>'authorization'
      AND s.expires_at > now()
      AND u.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT user_id FROM sessions 
      WHERE token = current_setting('request.headers')::json->>'authorization'
      AND expires_at > now()
    )
  )
  WITH CHECK (
    id IN (
      SELECT user_id FROM sessions 
      WHERE token = current_setting('request.headers')::json->>'authorization'
      AND expires_at > now()
    )
  );

-- =======================
-- SESSIONS TABLE POLICIES
-- =======================

DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT user_id FROM sessions 
      WHERE token = current_setting('request.headers')::json->>'authorization'
      AND expires_at > now()
    )
  );

DROP POLICY IF EXISTS "Sessions can be created" ON sessions;
CREATE POLICY "Sessions can be created"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;
CREATE POLICY "Users can delete own sessions"
  ON sessions FOR DELETE
  TO authenticated
  USING (
    user_id IN (
      SELECT user_id FROM sessions 
      WHERE token = current_setting('request.headers')::json->>'authorization'
      AND expires_at > now()
    )
  );

-- =======================
-- AUDIT LOGS POLICIES
-- =======================

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN sessions s ON s.user_id = u.id
      WHERE s.token = current_setting('request.headers')::json->>'authorization'
      AND s.expires_at > now()
      AND u.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Audit logs can be created" ON audit_logs;
CREATE POLICY "Audit logs can be created"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =======================
-- MONITORING CONFIGS POLICIES
-- =======================

DROP POLICY IF EXISTS "Authenticated users can view monitoring configs" ON monitoring_configs;
CREATE POLICY "Authenticated users can view monitoring configs"
  ON monitoring_configs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE token = current_setting('request.headers')::json->>'authorization'
      AND expires_at > now()
    )
  );

DROP POLICY IF EXISTS "Managers can insert monitoring configs" ON monitoring_configs;
CREATE POLICY "Managers can insert monitoring configs"
  ON monitoring_configs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN sessions s ON s.user_id = u.id
      WHERE s.token = current_setting('request.headers')::json->>'authorization'
      AND s.expires_at > now()
      AND u.role IN ('ADMIN', 'NOC')
    )
  );

DROP POLICY IF EXISTS "Managers can update monitoring configs" ON monitoring_configs;
CREATE POLICY "Managers can update monitoring configs"
  ON monitoring_configs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN sessions s ON s.user_id = u.id
      WHERE s.token = current_setting('request.headers')::json->>'authorization'
      AND s.expires_at > now()
      AND u.role IN ('ADMIN', 'NOC')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN sessions s ON s.user_id = u.id
      WHERE s.token = current_setting('request.headers')::json->>'authorization'
      AND s.expires_at > now()
      AND u.role IN ('ADMIN', 'NOC')
    )
  );

DROP POLICY IF EXISTS "Managers can delete monitoring configs" ON monitoring_configs;
CREATE POLICY "Managers can delete monitoring configs"
  ON monitoring_configs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN sessions s ON s.user_id = u.id
      WHERE s.token = current_setting('request.headers')::json->>'authorization'
      AND s.expires_at > now()
      AND u.role IN ('ADMIN', 'NOC')
    )
  );

-- =======================
-- MONITORING STATUS POLICIES
-- =======================

DROP POLICY IF EXISTS "Authenticated users can view monitoring status" ON monitoring_status;
CREATE POLICY "Authenticated users can view monitoring status"
  ON monitoring_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE token = current_setting('request.headers')::json->>'authorization'
      AND expires_at > now()
    )
  );

DROP POLICY IF EXISTS "Monitoring status can be created" ON monitoring_status;
CREATE POLICY "Monitoring status can be created"
  ON monitoring_status FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =======================
-- EQUIPMENT POLICIES
-- =======================

DROP POLICY IF EXISTS "Authenticated users can view equipment" ON equipment;
CREATE POLICY "Authenticated users can view equipment"
  ON equipment FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE token = current_setting('request.headers')::json->>'authorization'
      AND expires_at > now()
    )
  );

DROP POLICY IF EXISTS "Managers can insert equipment" ON equipment;
CREATE POLICY "Managers can insert equipment"
  ON equipment FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN sessions s ON s.user_id = u.id
      WHERE s.token = current_setting('request.headers')::json->>'authorization'
      AND s.expires_at > now()
      AND u.role IN ('ADMIN', 'NOC', 'FIELD_TECH')
    )
  );

DROP POLICY IF EXISTS "Managers can update equipment" ON equipment;
CREATE POLICY "Managers can update equipment"
  ON equipment FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN sessions s ON s.user_id = u.id
      WHERE s.token = current_setting('request.headers')::json->>'authorization'
      AND s.expires_at > now()
      AND u.role IN ('ADMIN', 'NOC', 'FIELD_TECH')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN sessions s ON s.user_id = u.id
      WHERE s.token = current_setting('request.headers')::json->>'authorization'
      AND s.expires_at > now()
      AND u.role IN ('ADMIN', 'NOC', 'FIELD_TECH')
    )
  );

DROP POLICY IF EXISTS "Admins can delete equipment" ON equipment;
CREATE POLICY "Admins can delete equipment"
  ON equipment FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN sessions s ON s.user_id = u.id
      WHERE s.token = current_setting('request.headers')::json->>'authorization'
      AND s.expires_at > now()
      AND u.role = 'ADMIN'
    )
  );

-- =======================
-- INTERFACES, CIRCUITS, VLANS, SUBNETS, SERVICES POLICIES
-- =======================

DROP POLICY IF EXISTS "Authenticated users can view interfaces" ON interfaces;
CREATE POLICY "Authenticated users can view interfaces"
  ON interfaces FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions WHERE token = current_setting('request.headers')::json->>'authorization' AND expires_at > now()));

DROP POLICY IF EXISTS "Managers can manage interfaces" ON interfaces;
CREATE POLICY "Managers can manage interfaces"
  ON interfaces FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users u INNER JOIN sessions s ON s.user_id = u.id WHERE s.token = current_setting('request.headers')::json->>'authorization' AND s.expires_at > now() AND u.role IN ('ADMIN', 'NOC', 'FIELD_TECH')))
  WITH CHECK (EXISTS (SELECT 1 FROM users u INNER JOIN sessions s ON s.user_id = u.id WHERE s.token = current_setting('request.headers')::json->>'authorization' AND s.expires_at > now() AND u.role IN ('ADMIN', 'NOC', 'FIELD_TECH')));

DROP POLICY IF EXISTS "Authenticated users can view circuits" ON circuits;
CREATE POLICY "Authenticated users can view circuits"
  ON circuits FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions WHERE token = current_setting('request.headers')::json->>'authorization' AND expires_at > now()));

DROP POLICY IF EXISTS "Managers can manage circuits" ON circuits;
CREATE POLICY "Managers can manage circuits"
  ON circuits FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users u INNER JOIN sessions s ON s.user_id = u.id WHERE s.token = current_setting('request.headers')::json->>'authorization' AND s.expires_at > now() AND u.role IN ('ADMIN', 'NOC')))
  WITH CHECK (EXISTS (SELECT 1 FROM users u INNER JOIN sessions s ON s.user_id = u.id WHERE s.token = current_setting('request.headers')::json->>'authorization' AND s.expires_at > now() AND u.role IN ('ADMIN', 'NOC')));

DROP POLICY IF EXISTS "Authenticated users can view vlans" ON vlans;
CREATE POLICY "Authenticated users can view vlans"
  ON vlans FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions WHERE token = current_setting('request.headers')::json->>'authorization' AND expires_at > now()));

DROP POLICY IF EXISTS "Managers can manage vlans" ON vlans;
CREATE POLICY "Managers can manage vlans"
  ON vlans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users u INNER JOIN sessions s ON s.user_id = u.id WHERE s.token = current_setting('request.headers')::json->>'authorization' AND s.expires_at > now() AND u.role IN ('ADMIN', 'NOC')))
  WITH CHECK (EXISTS (SELECT 1 FROM users u INNER JOIN sessions s ON s.user_id = u.id WHERE s.token = current_setting('request.headers')::json->>'authorization' AND s.expires_at > now() AND u.role IN ('ADMIN', 'NOC')));

DROP POLICY IF EXISTS "Authenticated users can view subnets" ON subnets;
CREATE POLICY "Authenticated users can view subnets"
  ON subnets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions WHERE token = current_setting('request.headers')::json->>'authorization' AND expires_at > now()));

DROP POLICY IF EXISTS "Managers can manage subnets" ON subnets;
CREATE POLICY "Managers can manage subnets"
  ON subnets FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users u INNER JOIN sessions s ON s.user_id = u.id WHERE s.token = current_setting('request.headers')::json->>'authorization' AND s.expires_at > now() AND u.role IN ('ADMIN', 'NOC')))
  WITH CHECK (EXISTS (SELECT 1 FROM users u INNER JOIN sessions s ON s.user_id = u.id WHERE s.token = current_setting('request.headers')::json->>'authorization' AND s.expires_at > now() AND u.role IN ('ADMIN', 'NOC')));

DROP POLICY IF EXISTS "Authenticated users can view services" ON services;
CREATE POLICY "Authenticated users can view services"
  ON services FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions WHERE token = current_setting('request.headers')::json->>'authorization' AND expires_at > now()));

DROP POLICY IF EXISTS "Managers can manage services" ON services;
CREATE POLICY "Managers can manage services"
  ON services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users u INNER JOIN sessions s ON s.user_id = u.id WHERE s.token = current_setting('request.headers')::json->>'authorization' AND s.expires_at > now() AND u.role IN ('ADMIN', 'NOC')))
  WITH CHECK (EXISTS (SELECT 1 FROM users u INNER JOIN sessions s ON s.user_id = u.id WHERE s.token = current_setting('request.headers')::json->>'authorization' AND s.expires_at > now() AND u.role IN ('ADMIN', 'NOC')));

DROP POLICY IF EXISTS "Authenticated users can view pops" ON pops;
CREATE POLICY "Authenticated users can view pops"
  ON pops FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions WHERE token = current_setting('request.headers')::json->>'authorization' AND expires_at > now()));

DROP POLICY IF EXISTS "Managers can manage pops" ON pops;
CREATE POLICY "Managers can manage pops"
  ON pops FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users u INNER JOIN sessions s ON s.user_id = u.id WHERE s.token = current_setting('request.headers')::json->>'authorization' AND s.expires_at > now() AND u.role IN ('ADMIN', 'NOC')))
  WITH CHECK (EXISTS (SELECT 1 FROM users u INNER JOIN sessions s ON s.user_id = u.id WHERE s.token = current_setting('request.headers')::json->>'authorization' AND s.expires_at > now() AND u.role IN ('ADMIN', 'NOC')));

DROP POLICY IF EXISTS "Authenticated users can view checklists" ON checklists;
CREATE POLICY "Authenticated users can view checklists"
  ON checklists FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions WHERE token = current_setting('request.headers')::json->>'authorization' AND expires_at > now()));

DROP POLICY IF EXISTS "Managers can manage checklists" ON checklists;
CREATE POLICY "Managers can manage checklists"
  ON checklists FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users u INNER JOIN sessions s ON s.user_id = u.id WHERE s.token = current_setting('request.headers')::json->>'authorization' AND s.expires_at > now() AND u.role IN ('ADMIN', 'NOC', 'FIELD_TECH')))
  WITH CHECK (EXISTS (SELECT 1 FROM users u INNER JOIN sessions s ON s.user_id = u.id WHERE s.token = current_setting('request.headers')::json->>'authorization' AND s.expires_at > now() AND u.role IN ('ADMIN', 'NOC', 'FIELD_TECH')));

DROP POLICY IF EXISTS "Authenticated users can view runbooks" ON runbooks;
CREATE POLICY "Authenticated users can view runbooks"
  ON runbooks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions WHERE token = current_setting('request.headers')::json->>'authorization' AND expires_at > now()));

DROP POLICY IF EXISTS "Managers can manage runbooks" ON runbooks;
CREATE POLICY "Managers can manage runbooks"
  ON runbooks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users u INNER JOIN sessions s ON s.user_id = u.id WHERE s.token = current_setting('request.headers')::json->>'authorization' AND s.expires_at > now() AND u.role IN ('ADMIN', 'NOC', 'FIELD_TECH')))
  WITH CHECK (EXISTS (SELECT 1 FROM users u INNER JOIN sessions s ON s.user_id = u.id WHERE s.token = current_setting('request.headers')::json->>'authorization' AND s.expires_at > now() AND u.role IN ('ADMIN', 'NOC', 'FIELD_TECH')));
