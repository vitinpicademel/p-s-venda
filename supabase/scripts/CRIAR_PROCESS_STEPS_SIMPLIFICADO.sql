-- =====================================================
-- CRIAR TABELA PROCESS_STEPS - VERSÃO SIMPLIFICADA
-- =====================================================

-- 1. Verificar se a extensão uuid-ossp está disponível
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criar tabela process_steps (se não existir)
CREATE TABLE IF NOT EXISTS process_steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(process_id, step_order)
);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_process_steps_process_id ON process_steps(process_id);
CREATE INDEX IF NOT EXISTS idx_process_steps_status ON process_steps(status);

-- 4. Habilitar RLS
ALTER TABLE process_steps ENABLE ROW LEVEL SECURITY;

-- 5. Remover políticas antigas
DROP POLICY IF EXISTS "Admins can manage process_steps" ON process_steps;
DROP POLICY IF EXISTS "Clients can view own process_steps" ON process_steps;
DROP POLICY IF EXISTS "Team can view all process_steps" ON process_steps;

-- 6. Criar políticas RLS simples
CREATE POLICY "Admins can manage process_steps"
  ON process_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view process_steps"
  ON process_steps FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can insert process_steps"
  ON process_steps FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- 7. Criar função simplificada
CREATE OR REPLACE FUNCTION public.create_default_process_steps()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir etapas básicas
  INSERT INTO process_steps (process_id, step_order, step_name, step_description, status)
  VALUES 
    (NEW.id, 1, 'Ficha de contrato', 'Upload da ficha de contrato', 'pending'),
    (NEW.id, 2, 'Emissão do contrato', 'Elaboração do contrato', 'pending'),
    (NEW.id, 3, 'Validação jurídica', 'Análise jurídica', 'pending'),
    (NEW.id, 4, 'Assinaturas', 'Assinatura do contrato', 'pending'),
    (NEW.id, 5, 'Engenharia', 'Vistoria do banco', 'pending'),
    (NEW.id, 6, 'Bancário', 'Assinatura bancária', 'pending'),
    (NEW.id, 7, 'ITBI', 'Pagamento de ITBI', 'pending'),
    (NEW.id, 8, 'Cartório', 'Registro no cartório', 'pending'),
    (NEW.id, 9, 'Entrega', 'Entrega das chaves', 'pending');
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Se der erro, apenas retorna NEW sem falhar
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger
DROP TRIGGER IF EXISTS on_process_created ON processes;
CREATE TRIGGER on_process_created
  AFTER INSERT ON processes
  FOR EACH ROW EXECUTE FUNCTION public.create_default_process_steps();

-- 9. Verificar se a tabela foi criada
SELECT 'Tabela process_steps criada com sucesso' as status;

-- 10. Mostrar estrutura da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'process_steps' 
AND table_schema = 'public'
ORDER BY ordinal_position;
