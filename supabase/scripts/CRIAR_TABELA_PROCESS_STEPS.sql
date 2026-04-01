-- =====================================================
-- CRIAR TABELA PROCESS_STEPS E CONFIGURAR RLS
-- =====================================================

-- 1. Criar tabela process_steps (se não existir)
CREATE TABLE IF NOT EXISTS process_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(process_id, step_order)
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_process_steps_process_id ON process_steps(process_id);
CREATE INDEX IF NOT EXISTS idx_process_steps_status ON process_steps(status);
CREATE INDEX IF NOT EXISTS idx_process_steps_order ON process_steps(process_id, step_order);

-- 3. Habilitar RLS
ALTER TABLE process_steps ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas antigas
DROP POLICY IF EXISTS "Admins can manage process_steps" ON process_steps;
DROP POLICY IF EXISTS "Clients can view own process_steps" ON process_steps;
DROP POLICY IF EXISTS "Read-only users can view all process_steps" ON process_steps;
DROP POLICY IF EXISTS "Team can view all process_steps" ON process_steps;
DROP POLICY IF EXISTS "Team can insert process_steps" ON process_steps;
DROP POLICY IF EXISTS "Team can update own process_steps" ON process_steps;

-- 5. Criar políticas RLS

-- Admins podem fazer tudo
CREATE POLICY "Admins can manage process_steps"
  ON process_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Clientes veem apenas próprios processos
CREATE POLICY "Clients can view own process_steps"
  ON process_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM processes
      WHERE processes.id = process_steps.process_id
        AND processes.client_email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- Equipe pode ver todos os process_steps
CREATE POLICY "Team can view all process_steps"
  ON process_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- Usuários autenticados podem inserir (via trigger)
CREATE POLICY "Authenticated users can insert process_steps"
  ON process_steps FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Usuários autenticados podem atualizar (via trigger)
CREATE POLICY "Authenticated users can update process_steps"
  ON process_steps FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
  );

-- 6. Criar função para criar etapas padrão
CREATE OR REPLACE FUNCTION public.create_default_process_steps()
RETURNS TRIGGER AS $$
BEGIN
  -- Apagar etapas antigas se existirem
  DELETE FROM process_steps WHERE process_id = NEW.id;
  
  -- Inserir as 9 etapas padrão
  INSERT INTO process_steps (process_id, step_order, step_name, step_description, status)
  VALUES 
    (NEW.id, 1, 'Ficha de contrato e Planilha de Cálculo', 'Upload da ficha de contrato e planilha de cálculo', 'pending'),
    (NEW.id, 2, 'Emissão do contrato', 'Elaboração e emissão do contrato de venda', 'pending'),
    (NEW.id, 3, 'Validação do jurídico', 'Análise e validação jurídica do contrato', 'pending'),
    (NEW.id, 4, 'Assinaturas do contrato', 'Assinatura das partes contratantes', 'pending'),
    (NEW.id, 5, 'Solicitação Engenharia', 'Solicitação de vistoria enviada ao banco', 'pending'),
    (NEW.id, 6, 'Assinatura do contrato bancário', 'Assinatura do contrato de financiamento', 'pending'),
    (NEW.id, 7, 'Recolhimento de ITBI', 'Pagamento do Imposto sobre Transmissão de Bens Imóveis', 'pending'),
    (NEW.id, 8, 'Entrada cartório para registro', 'Registro da escritura no cartório', 'pending'),
    (NEW.id, 9, 'Entrega de Chaves', 'Entrega das chaves e conclusão do processo', 'pending');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar trigger para criar etapas automaticamente
DROP TRIGGER IF EXISTS on_process_created ON processes;
CREATE TRIGGER on_process_created
  AFTER INSERT ON processes
  FOR EACH ROW EXECUTE FUNCTION public.create_default_process_steps();

-- 8. Verificar se a tabela foi criada
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'process_steps' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Verificar políticas criadas
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'process_steps'
ORDER BY policyname;
