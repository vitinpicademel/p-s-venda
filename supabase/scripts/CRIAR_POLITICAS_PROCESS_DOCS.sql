-- ============================================
-- POLÍTICAS DE STORAGE PARA O BUCKET arquivos
-- Execute este SQL APÓS criar o bucket 'arquivos' no Storage
-- ============================================
-- 
-- IMPORTANTE: Primeiro crie o bucket no Supabase Dashboard:
-- 1. Vá em Storage
-- 2. Clique em "New bucket"
-- 3. Nome: arquivos
-- 4. Public bucket: DESMARCADO (privado)
-- 5. Clique em "Create bucket"
-- 6. Depois execute este SQL
-- ============================================

-- Garantir que a função is_admin() existe
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
      AND role = 'admin'
  );
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- ============================================
-- POLÍTICAS PARA O BUCKET arquivos
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
-- VERIFICAÇÃO
-- ============================================
SELECT 
  '✅ Políticas criadas para arquivos' as status,
  COUNT(*) FILTER (WHERE policyname LIKE '%arquivos%') as total_policies
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

-- ============================================
-- MENSAGEM DE SUCESSO
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅✅✅ POLÍTICAS DE STORAGE PARA arquivos CRIADAS COM SUCESSO! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '1. Verifique se o bucket "arquivos" existe no Storage';
  RAISE NOTICE '2. Teste fazer upload de um documento';
  RAISE NOTICE '3. Se ainda der erro, verifique se você está logado como admin';
END $$;
