/*
  # Criar tabela de configurações de monitoramento

  1. Nova Tabela
    - `monitoring_configs`
      - `id` (uuid, primary key)
      - `name` (text) - Nome da configuração
      - `type` (text) - Tipo: ICMP, SNMP ou ZABBIX
      - `target` (text) - IP ou hostname alvo
      - `community` (text, optional) - SNMP community string
      - `version` (text, optional) - Versão SNMP
      - `zabbix_host_id` (text, optional) - ID do host no Zabbix
      - `zabbix_api_url` (text, optional) - URL da API do Zabbix
      - `zabbix_api_token` (text, optional) - Token de autenticação Zabbix
      - `interval` (integer) - Intervalo de monitoramento em segundos
      - `enabled` (boolean) - Se está habilitado
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Índices
    - Índice no campo `type` para filtros rápidos
    - Índice no campo `enabled` para filtros de ativos

  3. Observações
    - Tabela para gerenciar configurações de monitoramento via ICMP (ping), SNMP e integração com Zabbix
    - Campos específicos são opcionais dependendo do tipo de monitoramento
*/

CREATE TABLE IF NOT EXISTS monitoring_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('ICMP', 'SNMP', 'ZABBIX')),
  target text NOT NULL,
  community text,
  version text,
  zabbix_host_id text,
  zabbix_api_url text,
  zabbix_api_token text,
  interval integer NOT NULL DEFAULT 60,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_configs_type ON monitoring_configs(type);
CREATE INDEX IF NOT EXISTS idx_monitoring_configs_enabled ON monitoring_configs(enabled);
