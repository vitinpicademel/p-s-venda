-- ============================================
-- Versão Simplificada: Atualização das Etapas
-- Sistema de Acompanhamento Pós-Venda Imobiliário
-- ============================================

-- 1. Adicionar colunas para os arquivos da etapa 1
ALTER TABLE processes 
ADD COLUMN IF NOT EXISTS etapa1_ficha_url TEXT,
ADD COLUMN IF NOT EXISTS etapa1_ficha_filename TEXT,
ADD COLUMN IF NOT EXISTS etapa1_planilha_url TEXT,
ADD COLUMN IF NOT EXISTS etapa1_planilha_filename TEXT;

-- 2. Criar tabela para documentos das etapas
CREATE TABLE IF NOT EXISTS step_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  document_type TEXT NOT NULL, -- 'ficha' ou 'planilha'
  file_url TEXT NOT NULL,
  file_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(process_id, step_order, document_type)
);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_step_documents_process_id ON step_documents(process_id);
CREATE INDEX IF NOT EXISTS idx_step_documents_step_order ON step_documents(process_id, step_order);

-- 4. Habilitar RLS
ALTER TABLE step_documents ENABLE ROW LEVEL SECURITY;

-- 5. Política simples para admins
CREATE POLICY "Admins can manage step documents"
  ON step_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Atualizar função para criar as 9 novas etapas
CREATE OR REPLACE FUNCTION public.create_default_process_steps()
RETURNS TRIGGER AS $$
BEGIN
  -- Apagar etapas antigas se existirem
  DELETE FROM process_steps WHERE process_id = NEW.id;
  
  -- Inserir as 9 novas etapas
  INSERT INTO public.process_steps (process_id, step_order, step_name, step_description, status)
  VALUES 
    (NEW.id, 1, 'Ficha de contrato e Planilha de Cálculo', 'Upload da ficha de contrato e planilha de cálculo', 'pending'),
    (NEW.id, 2, 'Emissão do contrato', 'Elaboração e emissão do contrato de venda', 'pending'),
    (NEW.id, 3, 'Validação do jurídico', 'Análise e validação jurídica do contrato', 'pending'),
    (NEW.id, 4, 'Assinaturas do contrato', 'Assinatura das partes contratantes', 'pending'),
    (NEW.id, 5, 'Solicitação Engenharia', 'Análise e aprovação do financiamento bancário', 'pending'),
    (NEW.id, 6, 'Assinatura do contrato bancário', 'Assinatura do contrato de financiamento', 'pending'),
    (NEW.id, 7, 'Recolhimento de ITBI', 'Pagamento do Imposto sobre Transmissão de Bens Imóveis', 'pending'),
    (NEW.id, 8, 'Entrada cartório para registro', 'Registro da escritura no cartório', 'pending'),
    (NEW.id, 9, 'Entrega de Chaves', 'Entrega das chaves e conclusão do processo', 'pending');
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Recriar trigger
DROP TRIGGER IF EXISTS on_process_created ON processes;
CREATE TRIGGER on_process_created
  AFTER INSERT ON processes
  FOR EACH ROW EXECUTE FUNCTION public.create_default_process_steps();

-- 8. Atualizar processos existentes para ter as novas etapas
-- (Isso vai criar as 9 etapas para todos os processos existentes)
INSERT INTO process_steps (process_id, step_order, step_name, step_description, status)
SELECT 
  id,
  step_order,
  CASE step_order
    WHEN 1 THEN 'Ficha de contrato e Planilha de Cálculo'
    WHEN 2 THEN 'Emissão do contrato'
    WHEN 3 THEN 'Validação do jurídico'
    WHEN 4 THEN 'Assinaturas do contrato'
    WHEN 5 THEN 'Solicitação Engenharia'
    WHEN 6 THEN 'Assinatura do contrato bancário'
    WHEN 7 THEN 'Recolhimento de ITBI'
    WHEN 8 THEN 'Entrada cartório para registro'
    WHEN 9 THEN 'Entrega de Chaves'
  END,
  CASE step_order
    WHEN 1 THEN 'Upload da ficha de contrato e planilha de cálculo'
    WHEN 2 THEN 'Elaboração e emissão do contrato de venda'
    WHEN 3 THEN 'Análise e validação jurídica do contrato'
    WHEN 4 THEN 'Assinatura das partes contratantes'
    WHEN 5 THEN 'Análise e aprovação do financiamento bancário'
    WHEN 6 THEN 'Assinatura do contrato de financiamento'
    WHEN 7 THEN 'Pagamento do Imposto sobre Transmissão de Bens Imóveis'
    WHEN 8 THEN 'Registro da escritura no cartório'
    WHEN 9 THEN 'Entrega das chaves e conclusão do processo'
  END,
  'pending'
FROM processes p
CROSS JOIN generate_series(1, 9) AS step_order
WHERE NOT EXISTS (
  SELECT 1 FROM process_steps ps 
  WHERE ps.process_id = p.id AND ps.step_order = step_order
);
