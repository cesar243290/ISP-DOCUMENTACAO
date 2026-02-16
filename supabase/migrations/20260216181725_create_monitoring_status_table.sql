/*
  # Criar tabela de status de monitoramento

  1. Nova Tabela
    - `monitoring_status`
      - `id` (uuid, primary key)
      - `config_id` (uuid, foreign key) - Referência para monitoring_configs
      - `status` (text) - UP ou DOWN
      - `response_time` (integer, optional) - Tempo de resposta em ms
      - `last_check` (timestamptz) - Última verificação
      - `error_message` (text, optional) - Mensagem de erro se DOWN
      - `consecutive_failures` (integer) - Número de falhas consecutivas
      - `created_at` (timestamptz)

  2. Índices
    - Índice no campo `config_id` para busca rápida
    - Índice no campo `last_check` para ordenação

  3. Foreign Key
    - Relacionamento com `monitoring_configs`

  4. Observações
    - Armazena o histórico de status das verificações de monitoramento
    - Campo `consecutive_failures` útil para alertas
*/

CREATE TABLE IF NOT EXISTS monitoring_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES monitoring_configs(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('UP', 'DOWN', 'UNKNOWN')),
  response_time integer,
  last_check timestamptz DEFAULT now(),
  error_message text,
  consecutive_failures integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_status_config_id ON monitoring_status(config_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_status_last_check ON monitoring_status(last_check DESC);

-- View para pegar o último status de cada configuração
CREATE OR REPLACE VIEW monitoring_latest_status AS
SELECT DISTINCT ON (config_id)
  config_id,
  status,
  response_time,
  last_check,
  error_message,
  consecutive_failures
FROM monitoring_status
ORDER BY config_id, last_check DESC;
