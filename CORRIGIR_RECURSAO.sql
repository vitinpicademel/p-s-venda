-- ============================================
-- CORREÇÃO: Infinite Recursion nas Políticas RLS
-- Execute este script para corrigir o erro de recursão infinita
-- ============================================

-- Criar função auxiliar para verificar se usuário é admin
-- Esta função usa SECURITY DEFINER para evitar recursão
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- Corrigir políticas da tabela profiles
-- ============================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

-- ============================================
-- Corrigir políticas da tabela processes
-- ============================================

DROP POLICY IF EXISTS "Admins can view all processes" ON processes;
CREATE POLICY "Admins can view all processes"
  ON processes FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can create processes" ON processes;
CREATE POLICY "Admins can create processes"
  ON processes FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update processes" ON processes;
CREATE POLICY "Admins can update processes"
  ON processes FOR UPDATE
  USING (public.is_admin());

-- ============================================
-- Corrigir políticas da tabela process_documents
-- ============================================

DROP POLICY IF EXISTS "Admins can view all documents" ON process_documents;
CREATE POLICY "Admins can view all documents"
  ON process_documents FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can create documents" ON process_documents;
CREATE POLICY "Admins can create documents"
  ON process_documents FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update documents" ON process_documents;
CREATE POLICY "Admins can update documents"
  ON process_documents FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete documents" ON process_documents;
CREATE POLICY "Admins can delete documents"
  ON process_documents FOR DELETE
  USING (public.is_admin());

-- ============================================
-- Corrigir políticas do Storage
-- ============================================

-- Bucket contracts
DROP POLICY IF EXISTS "Admins can upload contracts" ON storage.objects;
CREATE POLICY "Admins can upload contracts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contracts' AND public.is_admin()
);

DROP POLICY IF EXISTS "Admins can view all contracts" ON storage.objects;
CREATE POLICY "Admins can view all contracts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contracts' AND public.is_admin()
);

DROP POLICY IF EXISTS "Admins can delete contracts" ON storage.objects;
CREATE POLICY "Admins can delete contracts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contracts' AND public.is_admin()
);

-- Bucket documents
DROP POLICY IF EXISTS "Admins can upload documents" ON storage.objects;
CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND public.is_admin()
);

DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND public.is_admin()
);

DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;
CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND public.is_admin()
);

-- ============================================
-- Mensagem de sucesso
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS corrigidas! Erro de recursão infinita resolvido.';
END $$;
