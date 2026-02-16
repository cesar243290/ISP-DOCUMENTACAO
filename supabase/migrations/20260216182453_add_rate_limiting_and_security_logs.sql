/*
  # Adicionar Rate Limiting e Logs de Segurança

  ## Segurança Implementada

  1. Tabela de Tentativas de Login
     - Rastreia tentativas falhas de login
     - Bloqueia após 5 tentativas em 15 minutos
     - Auto-limpeza de registros antigos

  2. Tabela de Eventos de Segurança
     - Registra eventos suspeitos
     - SQL injection attempts
     - XSS attempts
     - Acesso não autorizado
     - Rate limiting violations

  3. Funções de Proteção
     - check_login_attempts(): verifica se usuário está bloqueado
     - record_failed_login(): registra tentativa falha
     - record_security_event(): registra evento de segurança
     - cleanup_old_security_logs(): limpa logs antigos

  ## Proteções Implementadas
  - Brute force protection
  - Rate limiting por IP
  - Auditoria de segurança
  - Detecção de ataques
*/

-- Tabela para rastrear tentativas de login
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text,
  email text,
  ip_address text NOT NULL,
  user_agent text,
  success boolean DEFAULT false,
  failure_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username, created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email, created_at);

-- Tabela para eventos de segurança
CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  user_id uuid,
  ip_address text,
  user_agent text,
  request_path text,
  request_method text,
  payload jsonb,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity, created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address, created_at);

-- Função para verificar tentativas de login
CREATE OR REPLACE FUNCTION check_login_attempts(check_username text, check_ip text)
RETURNS TABLE (
  is_blocked boolean,
  attempts_count integer,
  block_expires_at timestamptz
) AS $$
DECLARE
  failed_attempts integer;
  last_attempt_time timestamptz;
BEGIN
  -- Contar tentativas falhas nos últimos 15 minutos
  SELECT COUNT(*), MAX(created_at)
  INTO failed_attempts, last_attempt_time
  FROM login_attempts
  WHERE (username = check_username OR ip_address = check_ip)
    AND success = false
    AND created_at > now() - interval '15 minutes';

  -- Bloquear se houver 5 ou mais tentativas falhas
  IF failed_attempts >= 5 THEN
    RETURN QUERY SELECT 
      true as is_blocked,
      failed_attempts as attempts_count,
      (last_attempt_time + interval '15 minutes') as block_expires_at;
  ELSE
    RETURN QUERY SELECT 
      false as is_blocked,
      failed_attempts as attempts_count,
      NULL::timestamptz as block_expires_at;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar tentativa de login
CREATE OR REPLACE FUNCTION record_login_attempt(
  attempt_username text,
  attempt_email text,
  attempt_ip text,
  attempt_user_agent text,
  attempt_success boolean,
  attempt_failure_reason text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO login_attempts (
    username,
    email,
    ip_address,
    user_agent,
    success,
    failure_reason
  ) VALUES (
    attempt_username,
    attempt_email,
    attempt_ip,
    attempt_user_agent,
    attempt_success,
    attempt_failure_reason
  );
  
  -- Se login bem-sucedido, limpar tentativas falhas anteriores
  IF attempt_success THEN
    DELETE FROM login_attempts
    WHERE (username = attempt_username OR ip_address = attempt_ip)
      AND success = false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar evento de segurança
CREATE OR REPLACE FUNCTION record_security_event(
  p_event_type text,
  p_severity text,
  p_user_id uuid DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_request_path text DEFAULT NULL,
  p_request_method text DEFAULT NULL,
  p_payload jsonb DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO security_events (
    event_type,
    severity,
    user_id,
    ip_address,
    user_agent,
    request_path,
    request_method,
    payload,
    description
  ) VALUES (
    p_event_type,
    p_severity,
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_request_path,
    p_request_method,
    p_payload,
    p_description
  )
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar logs antigos (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_old_security_logs()
RETURNS void AS $$
BEGIN
  -- Manter apenas 90 dias de login attempts
  DELETE FROM login_attempts
  WHERE created_at < now() - interval '90 days';

  -- Manter apenas 180 dias de security events
  DELETE FROM security_events
  WHERE created_at < now() - interval '180 days'
    AND severity IN ('LOW', 'MEDIUM');

  -- Manter eventos críticos por 1 ano
  DELETE FROM security_events
  WHERE created_at < now() - interval '1 year'
    AND severity IN ('HIGH', 'CRITICAL');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS nas novas tabelas
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - apenas admins podem ver
DROP POLICY IF EXISTS "Admins can view login attempts" ON login_attempts;
CREATE POLICY "Admins can view login attempts"
  ON login_attempts FOR SELECT
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

DROP POLICY IF EXISTS "System can insert login attempts" ON login_attempts;
CREATE POLICY "System can insert login attempts"
  ON login_attempts FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view security events" ON security_events;
CREATE POLICY "Admins can view security events"
  ON security_events FOR SELECT
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

DROP POLICY IF EXISTS "System can insert security events" ON security_events;
CREATE POLICY "System can insert security events"
  ON security_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE login_attempts IS 'Rastreia tentativas de login para proteção contra brute force';
COMMENT ON TABLE security_events IS 'Registra eventos de segurança suspeitos ou maliciosos';
COMMENT ON FUNCTION check_login_attempts IS 'Verifica se usuário/IP está bloqueado por excesso de tentativas';
COMMENT ON FUNCTION record_login_attempt IS 'Registra tentativa de login (sucesso ou falha)';
COMMENT ON FUNCTION record_security_event IS 'Registra evento de segurança para análise';
COMMENT ON FUNCTION cleanup_old_security_logs IS 'Remove logs antigos (executar via cron)';
