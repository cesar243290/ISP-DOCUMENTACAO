/*
  # Criar tabela de reconhecimento de alertas
  
  1. Nova Tabela
    - `alert_acknowledgements`
      - `id` (uuid, primary key)
      - `monitoring_status_id` (uuid, foreign key para monitoring_status)
      - `acknowledged_by` (uuid, foreign key para users)
      - `acknowledged_at` (timestamp)
      - `notes` (text, opcional)
      
  2. Segurança
    - RLS desabilitado (controle de acesso na aplicação)
    
  3. Notas Importantes
    - Esta tabela rastreia quais alertas foram reconhecidos por quais usuários
    - Um alerta pode ser reconhecido apenas uma vez
    - O reconhecimento é registrado na auditoria
*/

CREATE TABLE IF NOT EXISTS alert_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monitoring_status_id uuid NOT NULL,
  acknowledged_by uuid NOT NULL,
  acknowledged_at timestamptz DEFAULT now(),
  notes text,
  CONSTRAINT alert_acknowledgements_monitoring_status_id_fkey 
    FOREIGN KEY (monitoring_status_id) 
    REFERENCES monitoring_status(id) 
    ON DELETE CASCADE,
  CONSTRAINT alert_acknowledgements_acknowledged_by_fkey 
    FOREIGN KEY (acknowledged_by) 
    REFERENCES users(id) 
    ON DELETE CASCADE,
  CONSTRAINT alert_acknowledgements_unique 
    UNIQUE (monitoring_status_id)
);

CREATE INDEX IF NOT EXISTS idx_alert_acknowledgements_monitoring_status 
  ON alert_acknowledgements(monitoring_status_id);

CREATE INDEX IF NOT EXISTS idx_alert_acknowledgements_user 
  ON alert_acknowledgements(acknowledged_by);

COMMENT ON TABLE alert_acknowledgements IS 'Rastreia reconhecimentos de alertas de monitoramento pelos usuários';
