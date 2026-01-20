-- ============================================
-- Tabela de Logs de Atividades do Processo
-- Sistema de Acompanhamento Pós-Venda Imobiliário
-- ============================================

-- ============================================
-- TABELA: process_logs
-- Armazena o histórico de ações realizadas nos processos
-- ============================================
CREATE TABLE IF NOT EXISTS process_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de ação realizada
  action TEXT NOT NULL CHECK (action IN (
    'process_created',      -- Processo criado
    'process_updated',      -- Processo atualizado (nome/endereço)
    'step_toggled',         -- Etapa do processo marcada/desmarcada
    'document_uploaded',     -- Documento adicionado
    'document_deleted',     -- Documento excluído
    'contract_uploaded',    -- Contrato principal adicionado
    'status_changed'        -- Status do processo alterado
  )),
  
  -- Descrição detalhada da ação (formato amigável)
  description TEXT NOT NULL,
  
  -- Dados adicionais em JSONB (opcional, para contexto extra)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_process_logs_process_id ON process_logs(process_id);
CREATE INDEX IF NOT EXISTS idx_process_logs_user_id ON process_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_process_logs_created_at ON process_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_process_logs_action ON process_logs(action);

-- Índice composto para consulta otimizada na sidebar
CREATE INDEX IF NOT EXISTS idx_process_logs_process_created ON process_logs(process_id, created_at DESC);

-- ============================================
-- RLS (Row Level Security) Policies
-- ============================================

-- Habilitar RLS
ALTER TABLE process_logs ENABLE ROW LEVEL SECURITY;

-- Admin pode ver todos os logs
DROP POLICY IF EXISTS "Admins can view all logs" ON process_logs;
CREATE POLICY "Admins can view all logs"
  ON process_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin pode criar logs
DROP POLICY IF EXISTS "Admins can create logs" ON process_logs;
CREATE POLICY "Admins can create logs"
  ON process_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Cliente pode ver logs dos seus próprios processos
DROP POLICY IF EXISTS "Clients can view their own logs" ON process_logs;
CREATE POLICY "Clients can view their own logs"
  ON process_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM processes
      WHERE processes.id = process_logs.process_id
        AND processes.client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- ============================================
-- Função auxiliar para criar logs
-- ============================================

CREATE OR REPLACE FUNCTION create_process_log(
  p_process_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO process_logs (process_id, user_id, action, description, metadata)
  VALUES (p_process_id, p_user_id, p_action, p_description, p_metadata)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Verificação final
-- ============================================

SELECT 
  '✅ Tabela process_logs criada com sucesso' as status,
  'Logs de atividades do processo' as description,
  NOW() as created_at;
