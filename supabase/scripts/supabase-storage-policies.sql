-- ============================================
-- Políticas de Storage para o bucket 'contracts'
-- ============================================
-- IMPORTANTE: Execute este SQL APÓS criar o bucket 'contracts' no Storage
-- ============================================

-- Política para Admin fazer upload de contratos
CREATE POLICY "Admins can upload contracts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contracts' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para Admin visualizar todos os contratos
CREATE POLICY "Admins can view all contracts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contracts' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para Admin deletar contratos
CREATE POLICY "Admins can delete contracts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contracts' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para Cliente visualizar seus próprios contratos
CREATE POLICY "Clients can view their own contracts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contracts' AND
  EXISTS (
    SELECT 1 FROM processes
    WHERE processes.contract_url LIKE '%' || storage.objects.name || '%'
      AND processes.client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

