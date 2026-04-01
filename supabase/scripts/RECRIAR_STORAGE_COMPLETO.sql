-- ============================================
-- POLÍTICAS DE STORAGE PARA BUCKETS contracts, documents E arquivos
-- Execute este SQL APÓS criar os buckets no Storage
-- ============================================

-- ============================================
-- BUCKET: contracts
-- ============================================

-- Função auxiliar para verificar se usuário é admin (se não existir)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Política para Admin fazer upload de contratos
DROP POLICY IF EXISTS "Admins can upload contracts" ON storage.objects;
CREATE POLICY "Admins can upload contracts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contracts' AND public.is_admin()
);

-- Política para Admin visualizar todos os contratos
DROP POLICY IF EXISTS "Admins can view all contracts" ON storage.objects;
CREATE POLICY "Admins can view all contracts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contracts' AND public.is_admin()
);

-- Política para Admin deletar contratos
DROP POLICY IF EXISTS "Admins can delete contracts" ON storage.objects;
CREATE POLICY "Admins can delete contracts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contracts' AND public.is_admin()
);

-- Política para Cliente visualizar seus próprios contratos
DROP POLICY IF EXISTS "Clients can view their own contracts" ON storage.objects;
CREATE POLICY "Clients can view their own contracts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contracts' AND
  EXISTS (
    SELECT 1 FROM processes p
    INNER JOIN profiles pr ON pr.email = p.client_email
    WHERE p.contract_url LIKE '%' || storage.objects.name || '%'
      AND pr.id = auth.uid()
  )
);

-- ============================================
-- BUCKET: documents
-- ============================================

-- Política para Admin fazer upload de documentos
DROP POLICY IF EXISTS "Admins can upload documents" ON storage.objects;
CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND public.is_admin()
);

-- Política para Admin visualizar todos os documentos
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND public.is_admin()
);

-- Política para Admin deletar documentos
DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;
CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND public.is_admin()
);

-- Política para Cliente visualizar documentos de seus próprios processos
DROP POLICY IF EXISTS "Clients can view their own documents" ON storage.objects;
CREATE POLICY "Clients can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM process_documents pd
    INNER JOIN processes p ON p.id = pd.process_id
    INNER JOIN profiles pr ON pr.email = p.client_email
    WHERE (pd.documents::text LIKE '%' || storage.objects.name || '%'
      OR (pd.spouse_data IS NOT NULL AND pd.spouse_data::text LIKE '%' || storage.objects.name || '%'))
      AND pr.id = auth.uid()
  )
);

-- ============================================
-- BUCKET: arquivos
-- ============================================

-- Política para Admin fazer upload de documentos do processo
DROP POLICY IF EXISTS "Admins can upload process-docs" ON storage.objects;
CREATE POLICY "Admins can upload process-docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'arquivos' AND public.is_admin()
);

-- Política para Admin visualizar todos os documentos do processo
DROP POLICY IF EXISTS "Admins can view all process-docs" ON storage.objects;
CREATE POLICY "Admins can view all process-docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'arquivos' AND public.is_admin()
);

-- Política para Admin atualizar documentos do processo
DROP POLICY IF EXISTS "Admins can update process-docs" ON storage.objects;
CREATE POLICY "Admins can update process-docs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'arquivos' AND public.is_admin()
);

-- Política para Admin deletar documentos do processo
DROP POLICY IF EXISTS "Admins can delete process-docs" ON storage.objects;
CREATE POLICY "Admins can delete process-docs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'arquivos' AND public.is_admin()
);

-- Política para Cliente visualizar documentos de seus próprios processos
DROP POLICY IF EXISTS "Clients can view their own process-docs" ON storage.objects;
CREATE POLICY "Clients can view their own process-docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'arquivos' AND
  EXISTS (
    SELECT 1 FROM process_documents pd
    INNER JOIN processes p ON p.id = pd.process_id
    INNER JOIN profiles pr ON pr.email = p.client_email
    WHERE (pd.documents->>'file_path') = storage.objects.name
      AND pr.id = auth.uid()
  )
);

-- ============================================
-- MENSAGEM DE SUCESSO
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas de Storage criadas com sucesso!';
  RAISE NOTICE 'Buckets configurados: contracts, documents, arquivos';
END $$;
