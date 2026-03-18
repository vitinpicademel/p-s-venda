-- ============================================
-- Políticas de Storage para o bucket 'documents'
-- ============================================
-- IMPORTANTE: Execute este SQL APÓS criar o bucket 'documents' no Storage
-- ============================================
-- 
-- Para criar o bucket:
-- 1. No Supabase Dashboard, vá em Storage
-- 2. Clique em "New bucket"
-- 3. Nome: documents
-- 4. Public bucket: DESMARCADO (privado)
-- 5. Clique em "Create bucket"
-- 6. Depois execute este SQL no SQL Editor
-- ============================================

-- Política para Admin fazer upload de documentos
CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para Admin visualizar todos os documentos
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para Admin deletar documentos
CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para Cliente visualizar documentos de seus próprios processos
CREATE POLICY "Clients can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM process_documents pd
    INNER JOIN processes p ON p.id = pd.process_id
    WHERE pd.documents::text LIKE '%' || storage.objects.name || '%'
      OR (pd.spouse_data IS NOT NULL AND pd.spouse_data::text LIKE '%' || storage.objects.name || '%')
      AND p.client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);
