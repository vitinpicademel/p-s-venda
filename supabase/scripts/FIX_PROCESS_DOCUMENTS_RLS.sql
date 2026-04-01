-- =====================================================
-- CORREÇÃO DEFINITIVA: PERMISSÕES DE ARQUIVOS (process_documents) E STORAGE
-- =====================================================
-- 1. Cria políticas RLS adequadas para SELECT, INSERT e DELETE na tabela process_documents.
-- 2. Permite que Secretaria, Financeiro, Administrativo e Gestor gerenciem os arquivos do processo.

BEGIN;

-- =====================================================
-- PASSO 1: Garantir que o RLS está ativo
-- =====================================================
ALTER TABLE process_documents ENABLE ROW LEVEL SECURITY;

-- Remove as políticas antigas de documentos
DROP POLICY IF EXISTS "Admins can view all documents" ON process_documents;
DROP POLICY IF EXISTS "Admins can create documents" ON process_documents;
DROP POLICY IF EXISTS "Admins can update documents" ON process_documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON process_documents;
DROP POLICY IF EXISTS "Clients can view their own documents" ON process_documents;
DROP POLICY IF EXISTS "Clients can view own documents" ON process_documents;


-- =====================================================
-- PASSO 2: Políticas RLS para tabela process_documents
-- =====================================================

-- 2.1. SELECT: Quem pode ver os documentos?
-- Admins e Equipe veem tudo. Clientes veem os do próprio processo.
CREATE POLICY "Team and Admins can view process_documents"
  ON process_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

CREATE POLICY "Clients can view own process_documents"
  ON process_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM processes p
      WHERE p.id = process_documents.process_id 
      AND p.client_email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- 2.2. INSERT: Quem pode anexar documentos?
-- Admins e toda a equipe interna
CREATE POLICY "Team and Admins can insert process_documents"
  ON process_documents FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- 2.3. UPDATE: Quem pode atualizar documentos?
-- Admins e equipe interna
CREATE POLICY "Team and Admins can update process_documents"
  ON process_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- 2.4. DELETE: Quem pode excluir documentos?
-- Admins e equipe interna
CREATE POLICY "Team and Admins can delete process_documents"
  ON process_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );


-- =====================================================
-- PASSO 3: Políticas para o Storage Bucket 'arquivos'
-- =====================================================

-- Primeiro, limpar políticas antigas de Storage relacionadas a processos
DROP POLICY IF EXISTS "Authenticated users can upload process files" ON storage.objects;
DROP POLICY IF EXISTS "Team can insert process files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can insert process files" ON storage.objects;

-- 3.1. INSERT (Upload): Equipe e Admins podem fazer upload de novos arquivos
CREATE POLICY "Team can upload files to arquivos bucket" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'arquivos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'secretaria', 'financeiro', 'administrativo', 'gestor')
  )
);

-- 3.2. UPDATE: Equipe e Admins podem substituir arquivos
CREATE POLICY "Team can update files in arquivos bucket" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'arquivos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'secretaria', 'financeiro', 'administrativo', 'gestor')
  )
);

-- 3.3. DELETE: Equipe e Admins podem deletar arquivos
CREATE POLICY "Team can delete files from arquivos bucket" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'arquivos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'secretaria', 'financeiro', 'administrativo', 'gestor')
  )
);

-- 3.4 SELECT (Baixar/Ler): Qualquer usuário autenticado (incluindo clientes) pode baixar desde que acesse via URL
CREATE POLICY "Authenticated users can view files in arquivos bucket" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'arquivos');

COMMIT;

-- FIM DA CORREÇÃO
