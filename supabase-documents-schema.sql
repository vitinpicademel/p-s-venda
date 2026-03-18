-- ============================================
-- Schema para Documentos de Comprador e Vendedor
-- Sistema de Acompanhamento Pós-Venda Imobiliário
-- ============================================

-- ============================================
-- TABELA: process_documents
-- Armazena documentos de compradores e vendedores vinculados a processos
-- ============================================
CREATE TABLE IF NOT EXISTS process_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  person_type TEXT NOT NULL CHECK (person_type IN ('comprador', 'vendedor')),
  
  -- Dados pessoais
  telefone TEXT,
  email TEXT,
  profissao TEXT,
  estado_civil TEXT NOT NULL CHECK (estado_civil IN ('solteiro', 'casado', 'divorciado', 'viuvo')),
  
  -- Documentos da pessoa principal (JSONB para flexibilidade)
  documents JSONB DEFAULT '{}'::jsonb,
  
  -- Dados do cônjuge (se casado) - JSONB
  spouse_data JSONB DEFAULT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_process_documents_process_id ON process_documents(process_id);
CREATE INDEX IF NOT EXISTS idx_process_documents_person_type ON process_documents(person_type);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_process_documents_updated_at ON process_documents;
CREATE TRIGGER update_process_documents_updated_at
  BEFORE UPDATE ON process_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (Row Level Security) Policies
-- ============================================

-- Habilitar RLS
ALTER TABLE process_documents ENABLE ROW LEVEL SECURITY;

-- Admin pode ver todos os documentos
DROP POLICY IF EXISTS "Admins can view all documents" ON process_documents;
CREATE POLICY "Admins can view all documents"
  ON process_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin pode criar documentos
DROP POLICY IF EXISTS "Admins can create documents" ON process_documents;
CREATE POLICY "Admins can create documents"
  ON process_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin pode atualizar documentos
DROP POLICY IF EXISTS "Admins can update documents" ON process_documents;
CREATE POLICY "Admins can update documents"
  ON process_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin pode deletar documentos
DROP POLICY IF EXISTS "Admins can delete documents" ON process_documents;
CREATE POLICY "Admins can delete documents"
  ON process_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Cliente pode ver documentos de seus próprios processos
DROP POLICY IF EXISTS "Clients can view their own documents" ON process_documents;
CREATE POLICY "Clients can view their own documents"
  ON process_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM processes
      WHERE processes.id = process_documents.process_id
        AND processes.client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
