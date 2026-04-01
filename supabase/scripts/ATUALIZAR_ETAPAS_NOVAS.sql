-- ============================================
-- Atualização do Schema: Novo Fluxo de Etapas
-- Sistema de Acompanhamento Pós-Venda Imobiliário
-- ============================================

-- Primeiro, vamos atualizar a função que cria as etapas padrão
CREATE OR REPLACE FUNCTION public.create_default_process_steps()
RETURNS TRIGGER AS $$
BEGIN
  -- Etapa 1: Ficha de contrato e Planilha de Cálculo (pendente - precisa de upload)
  INSERT INTO public.process_steps (process_id, step_order, step_name, step_description, status)
  VALUES (NEW.id, 1, 'Ficha de contrato e Planilha de Cálculo', 'Upload da ficha de contrato e planilha de cálculo', 'pending');

  -- Etapa 2: Emissão do contrato
  INSERT INTO public.process_steps (process_id, step_order, step_name, step_description, status)
  VALUES (NEW.id, 2, 'Emissão do contrato', 'Elaboração e emissão do contrato de venda', 'pending');

  -- Etapa 3: Validação do jurídico
  INSERT INTO public.process_steps (process_id, step_order, step_name, step_description, status)
  VALUES (NEW.id, 3, 'Validação do jurídico', 'Análise e validação jurídica do contrato', 'pending');

  -- Etapa 4: Assinaturas do contrato
  INSERT INTO public.process_steps (process_id, step_order, step_name, step_description, status)
  VALUES (NEW.id, 4, 'Assinaturas do contrato', 'Assinatura das partes contratantes', 'pending');

  -- Etapa 5: Solicitação Engenharia
  INSERT INTO public.process_steps (process_id, step_order, step_name, step_description, status)
  VALUES (NEW.id, 5, 'Solicitação Engenharia', 'Análise e aprovação do financiamento bancário', 'pending');

  -- Etapa 6: Assinatura do contrato bancário
  INSERT INTO public.process_steps (process_id, step_order, step_name, step_description, status)
  VALUES (NEW.id, 6, 'Assinatura do contrato bancário', 'Assinatura do contrato de financiamento', 'pending');

  -- Etapa 7: Recolhimento de ITBI
  INSERT INTO public.process_steps (process_id, step_order, step_name, step_description, status)
  VALUES (NEW.id, 7, 'Recolhimento de ITBI', 'Pagamento do Imposto sobre Transmissão de Bens Imóveis', 'pending');

  -- Etapa 8: Entrada cartório para registro
  INSERT INTO public.process_steps (process_id, step_order, step_name, step_description, status)
  VALUES (NEW.id, 8, 'Entrada cartório para registro', 'Registro da escritura no cartório', 'pending');

  -- Etapa 9: Processo Finalizado (só será concluída quando todas as outras estiverem prontas)
  INSERT INTO public.process_steps (process_id, step_order, step_name, step_description, status)
  VALUES (NEW.id, 9, 'Processo Finalizado', 'Entrega das chaves e conclusão do processo', 'pending');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar a função que verifica conclusão do processo
CREATE OR REPLACE FUNCTION public.update_process_status()
RETURNS TRIGGER AS $$
DECLARE
  total_steps INTEGER;
  completed_steps INTEGER;
BEGIN
  -- Conta total de etapas (exceto a última "Processo Finalizado")
  SELECT COUNT(*) INTO total_steps
  FROM public.process_steps
  WHERE process_id = NEW.process_id AND step_order < 9;

  -- Conta etapas concluídas (exceto a última)
  SELECT COUNT(*) INTO completed_steps
  FROM public.process_steps
  WHERE process_id = NEW.process_id 
    AND step_order < 9 
    AND status = 'completed';

  -- Se todas as etapas (exceto a última) estiverem concluídas, marca a última como concluída
  IF completed_steps = total_steps THEN
    UPDATE public.process_steps
    SET status = 'completed', 
        completed_at = NOW(),
        updated_at = NOW()
    WHERE process_id = NEW.process_id AND step_order = 9;

    -- Atualiza status do processo
    UPDATE public.processes
    SET status = 'completed', updated_at = NOW()
    WHERE id = NEW.process_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar colunas para armazenar os arquivos da etapa 1
ALTER TABLE processes 
ADD COLUMN IF NOT EXISTS etapa1_ficha_url TEXT,
ADD COLUMN IF NOT EXISTS etapa1_ficha_filename TEXT,
ADD COLUMN IF NOT EXISTS etapa1_planilha_url TEXT,
ADD COLUMN IF NOT EXISTS etapa1_planilha_filename TEXT;

-- Criar tabela para documentos específicos das etapas
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_step_documents_process_id ON step_documents(process_id);
CREATE INDEX IF NOT EXISTS idx_step_documents_step_order ON step_documents(process_id, step_order);

-- Políticas RLS para step_documents
ALTER TABLE step_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage step documents"
  ON step_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Clients can view step documents of their processes"
  ON step_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM processes
      WHERE processes.id = step_documents.process_id
        AND processes.client_email = (
          SELECT email FROM profiles WHERE id = auth.uid()
        )
    )
  );

-- Trigger para criar etapas automaticamente (já existe, mas garantindo)
DROP TRIGGER IF EXISTS on_process_created ON processes;
CREATE TRIGGER on_process_created
  AFTER INSERT ON processes
  FOR EACH ROW EXECUTE FUNCTION public.create_default_process_steps();

-- Trigger para atualizar status do processo (já existe, mas garantindo)
DROP TRIGGER IF EXISTS on_process_step_updated ON process_steps;
CREATE TRIGGER on_process_step_updated
  AFTER UPDATE OF status ON process_steps
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status = 'pending')
  EXECUTE FUNCTION public.update_process_status();

-- Storage policies para os novos arquivos
-- Nota: Execute isso no Supabase Dashboard > Storage
/*
CREATE POLICY "Admins can upload step documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'contracts' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own step documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracts' AND
    EXISTS (
      SELECT 1 FROM step_documents
      WHERE step_documents.file_path LIKE '%' || storage.objects.name || '%'
        AND EXISTS (
          SELECT 1 FROM processes
          WHERE processes.id = step_documents.process_id
            AND (
              processes.client_email = (SELECT email FROM profiles WHERE id = auth.uid())
              OR processes.admin_id = auth.uid()
            )
        )
    )
  );
*/
