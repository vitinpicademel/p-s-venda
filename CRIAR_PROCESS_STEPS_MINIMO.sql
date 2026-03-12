-- =====================================================
-- CRIAR TABELA PROCESS_STEPS - VERSÃO MÍNIMA
-- =====================================================

-- 1. Criar tabela process_steps da forma mais simples possível
CREATE TABLE IF NOT EXISTS process_steps (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  process_id TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(process_id, step_order)
);

-- 2. Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_process_steps_process_id ON process_steps(process_id);

-- 3. Habilitar RLS
ALTER TABLE process_steps ENABLE ROW LEVEL SECURITY;

-- 4. Política RLS simples - permitir tudo para começar
DROP POLICY IF EXISTS "Enable all for process_steps" ON process_steps;
CREATE POLICY "Enable all for process_steps"
  ON process_steps FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Criar função básica sem UUID
CREATE OR REPLACE FUNCTION public.create_default_process_steps()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir etapas usando TEXT para IDs
  INSERT INTO process_steps (process_id, step_order, step_name, step_description, status)
  VALUES 
    (NEW.id::text, 1, 'Ficha de contrato', 'Upload da ficha', 'pending'),
    (NEW.id::text, 2, 'Emissão do contrato', 'Elaboração', 'pending'),
    (NEW.id::text, 3, 'Validação jurídica', 'Análise', 'pending'),
    (NEW.id::text, 4, 'Assinaturas', 'Assinatura', 'pending'),
    (NEW.id::text, 5, 'Engenharia', 'Vistoria', 'pending'),
    (NEW.id::text, 6, 'Bancário', 'Assinatura', 'pending'),
    (NEW.id::text, 7, 'ITBI', 'Pagamento', 'pending'),
    (NEW.id::text, 8, 'Cartório', 'Registro', 'pending'),
    (NEW.id::text, 9, 'Entrega', 'Chaves', 'pending');
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Se der erro, apenas continua
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger
DROP TRIGGER IF EXISTS on_process_created ON processes;
CREATE TRIGGER on_process_created
  AFTER INSERT ON processes
  FOR EACH ROW EXECUTE FUNCTION public.create_default_process_steps();

-- 7. Verificação
SELECT 'Tabela process_steps criada (versão mínima)' as status;
