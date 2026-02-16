/*
  # Criptografar Dados Sensíveis em Monitoring Configs

  ## Segurança Implementada

  1. Criptografia de Dados
     - zabbix_api_token agora criptografado
     - community strings SNMP criptografados
     - Usa pgcrypto para criptografia AES

  2. Funções Auxiliares
     - encrypt_token(): criptografa dados sensíveis
     - decrypt_token(): descriptografa para uso
     - get_encryption_key(): obtém chave de criptografia

  3. Views Seguras
     - monitoring_configs_secure: retorna dados sem tokens expostos
     - Tokens apenas descriptografados quando necessário

  ## Importante
  - Tokens nunca devem ser expostos no frontend
  - Apenas Edge Functions devem descriptografar tokens
  - Logs não devem conter dados sensíveis
*/

-- Habilitar extensão pgcrypto se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função para obter chave de criptografia
CREATE OR REPLACE FUNCTION get_encryption_key()
RETURNS bytea AS $$
BEGIN
  RETURN digest('isp-noc-encryption-key-v1', 'sha256');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criptografar tokens
CREATE OR REPLACE FUNCTION encrypt_token(plaintext text)
RETURNS text AS $$
BEGIN
  IF plaintext IS NULL OR plaintext = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN encode(
    encrypt(
      plaintext::bytea,
      get_encryption_key(),
      'aes'
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para descriptografar tokens
CREATE OR REPLACE FUNCTION decrypt_token(ciphertext text)
RETURNS text AS $$
BEGIN
  IF ciphertext IS NULL OR ciphertext = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN convert_from(
    decrypt(
      decode(ciphertext, 'base64'),
      get_encryption_key(),
      'aes'
    ),
    'utf8'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alterar tabela para adicionar colunas criptografadas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'monitoring_configs' AND column_name = 'zabbix_api_token_encrypted'
  ) THEN
    ALTER TABLE monitoring_configs ADD COLUMN zabbix_api_token_encrypted text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'monitoring_configs' AND column_name = 'community_encrypted'
  ) THEN
    ALTER TABLE monitoring_configs ADD COLUMN community_encrypted text;
  END IF;
END $$;

-- Migrar dados existentes para formato criptografado
UPDATE monitoring_configs 
SET zabbix_api_token_encrypted = encrypt_token(zabbix_api_token)
WHERE zabbix_api_token IS NOT NULL AND zabbix_api_token_encrypted IS NULL;

UPDATE monitoring_configs 
SET community_encrypted = encrypt_token(community)
WHERE community IS NOT NULL AND community_encrypted IS NULL;

-- Criar view segura que esconde tokens
CREATE OR REPLACE VIEW monitoring_configs_secure AS
SELECT 
  id,
  name,
  type,
  target,
  CASE WHEN community IS NOT NULL THEN '***HIDDEN***' ELSE NULL END as community,
  version,
  zabbix_host_id,
  zabbix_api_url,
  CASE WHEN zabbix_api_token IS NOT NULL THEN '***HIDDEN***' ELSE NULL END as zabbix_api_token,
  "interval",
  enabled,
  created_at,
  updated_at
FROM monitoring_configs;

-- Trigger para criptografar automaticamente ao inserir/atualizar
CREATE OR REPLACE FUNCTION encrypt_monitoring_config_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.zabbix_api_token IS NOT NULL AND NEW.zabbix_api_token != '' THEN
    NEW.zabbix_api_token_encrypted := encrypt_token(NEW.zabbix_api_token);
    NEW.zabbix_api_token := NULL;
  END IF;

  IF NEW.community IS NOT NULL AND NEW.community != '' THEN
    NEW.community_encrypted := encrypt_token(NEW.community);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS encrypt_monitoring_config_before_insert ON monitoring_configs;
CREATE TRIGGER encrypt_monitoring_config_before_insert
  BEFORE INSERT ON monitoring_configs
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_monitoring_config_trigger();

DROP TRIGGER IF EXISTS encrypt_monitoring_config_before_update ON monitoring_configs;
CREATE TRIGGER encrypt_monitoring_config_before_update
  BEFORE UPDATE ON monitoring_configs
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_monitoring_config_trigger();

-- Função segura para obter configuração descriptografada
CREATE OR REPLACE FUNCTION get_monitoring_config_decrypted(config_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  type text,
  target text,
  community text,
  version text,
  zabbix_host_id text,
  zabbix_api_url text,
  zabbix_api_token text,
  check_interval integer,
  enabled boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.id,
    mc.name,
    mc.type,
    mc.target,
    COALESCE(decrypt_token(mc.community_encrypted), mc.community) as community,
    mc.version,
    mc.zabbix_host_id,
    mc.zabbix_api_url,
    COALESCE(decrypt_token(mc.zabbix_api_token_encrypted), mc.zabbix_api_token) as zabbix_api_token,
    mc."interval" as check_interval,
    mc.enabled
  FROM monitoring_configs mc
  WHERE mc.id = config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION encrypt_token IS 'Criptografa dados sensíveis usando AES-256';
COMMENT ON FUNCTION decrypt_token IS 'Descriptografa dados sensíveis - USE COM CAUTELA';
COMMENT ON VIEW monitoring_configs_secure IS 'View segura que esconde tokens e credenciais';
COMMENT ON FUNCTION get_monitoring_config_decrypted IS 'Retorna configuração com dados descriptografados - APENAS PARA BACKEND';
