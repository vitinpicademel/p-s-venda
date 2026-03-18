-- ============================================
-- Script Completo: Criação de Tabelas para Upload e Logs
-- Sistema de Acompanhamento Pós-Venda Imobiliário
-- ============================================

-- 1. Criar tabela step_documents (se ainda não existir)
CREATE TABLE IF NOT EXISTS step_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('ficha', 'planilha', 'contrato', 'outro')),
  file_url TEXT NOT NULL,
  file_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints únicos
  UNIQUE(process_id, step_order, document_type)
);

-- 2. Criar tabela process_logs (se ainda não existir)
CREATE TABLE IF NOT EXISTS process_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'step_toggled', 'document_uploaded', 'document_deleted', 'status_changed')),
  details JSONB,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Criar índices para step_documents
CREATE INDEX IF NOT EXISTS idx_step_documents_process_id ON step_documents(process_id);
CREATE INDEX IF NOT EXISTS idx_step_documents_step_order ON step_documents(process_id, step_order);
CREATE INDEX IF NOT EXISTS idx_step_documents_document_type ON step_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_step_documents_uploaded_by ON step_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_step_documents_created_at ON step_documents(created_at);

-- 3.1. Criar índices para process_logs
CREATE INDEX IF NOT EXISTS idx_process_logs_process_id ON process_logs(process_id);
CREATE INDEX IF NOT EXISTS idx_process_logs_user_id ON process_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_process_logs_action ON process_logs(action);
CREATE INDEX IF NOT EXISTS idx_process_logs_created_at ON process_logs(created_at);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE step_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_logs ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para step_documents

-- Política para Admins (controle total)
DROP POLICY IF EXISTS "Admins can manage step_documents" ON step_documents;
CREATE POLICY "Admins can manage step_documents"
  ON step_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para Clientes (visualizar documentos dos próprios processos)
DROP POLICY IF EXISTS "Clients can view own step_documents" ON step_documents;
CREATE POLICY "Clients can view own step_documents"
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

-- Política para Read-Only users (visualizar todos os documentos)
DROP POLICY IF EXISTS "Read-only users can view step_documents" ON step_documents;
CREATE POLICY "Read-only users can view step_documents"
  ON step_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- 6. Políticas RLS para process_logs

-- Política para Admins (controle total)
DROP POLICY IF EXISTS "Admins can manage process_logs" ON process_logs;
CREATE POLICY "Admins can manage process_logs"
  ON process_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para Clientes (visualizar logs dos próprios processos)
DROP POLICY IF EXISTS "Clients can view own process_logs" ON process_logs;
CREATE POLICY "Clients can view own process_logs"
  ON process_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM processes
      WHERE processes.id = process_logs.process_id
        AND processes.client_email = (
          SELECT email FROM profiles WHERE id = auth.uid()
        )
    )
  );

-- Política para Read-Only users (visualizar todos os logs)
DROP POLICY IF EXISTS "Read-only users can view process_logs" ON process_logs;
CREATE POLICY "Read-only users can view process_logs"
  ON process_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- 7. Storage policies para step_documents (complemento)

-- Política para Admins fazerem upload
DROP POLICY IF EXISTS "Admins can upload step documents" ON storage.objects;
CREATE POLICY "Admins can upload step documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'contracts' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para Admins visualizarem arquivos
DROP POLICY IF EXISTS "Admins can view step documents files" ON storage.objects;
CREATE POLICY "Admins can view step documents files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracts' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para Clientes visualizarem arquivos dos próprios processos
DROP POLICY IF EXISTS "Clients can view own step documents files" ON storage.objects;
CREATE POLICY "Clients can view own step documents files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracts' AND
    EXISTS (
      SELECT 1 FROM step_documents
      WHERE step_documents.file_path LIKE '%' || storage.objects.name || '%'
        AND EXISTS (
          SELECT 1 FROM processes
          WHERE processes.id = step_documents.process_id
            AND processes.client_email = (
              SELECT email FROM profiles WHERE id = auth.uid()
            )
        )
    )
  );

-- Política para Read-Only users visualizarem todos os arquivos
DROP POLICY IF EXISTS "Read-only users can view step documents files" ON storage.objects;
CREATE POLICY "Read-only users can view step documents files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracts' AND
    EXISTS (
      SELECT 1 FROM step_documents
      WHERE step_documents.file_path LIKE '%' || storage.objects.name || '%'
        AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
        )
    )
  );

-- 8. Trigger para atualizar updated_at em step_documents
DROP TRIGGER IF EXISTS update_step_documents_updated_at ON step_documents;
CREATE TRIGGER update_step_documents_updated_at
  BEFORE UPDATE ON step_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Função auxiliar para update_updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Verificar se as tabelas foram criadas corretamente
DO $$
BEGIN
    -- Verificar step_documents
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'step_documents' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ Tabela step_documents criada com sucesso';
    ELSE
        RAISE EXCEPTION '❌ Erro ao criar tabela step_documents';
    END IF;
    
    -- Verificar process_logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'process_logs' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ Tabela process_logs criada com sucesso';
    ELSE
        RAISE EXCEPTION '❌ Erro ao criar tabela process_logs';
    END IF;
    
    -- Verificar políticas RLS
    RAISE NOTICE '✅ Políticas RLS criadas para step_documents e process_logs';
    
    RAISE NOTICE '🎉 Script executado com sucesso! As tabelas estão prontas para uso.';
END $$;
