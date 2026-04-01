-- ============================================
-- SOLUÇÃO DIRETA: Políticas sem função is_admin()
-- Usa verificação direta na política para evitar problemas
-- ============================================

-- 1. REMOVER TODAS AS POLÍTICAS ANTIGAS
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects'
          AND (policyname LIKE '%process-docs%' 
               OR policyname LIKE '%process_docs%')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
    END LOOP;
END $$;

-- 2. CRIAR POLÍTICAS DIRETAS (SEM FUNÇÃO is_admin())
-- Usa verificação direta na política para garantir que funciona

-- Política para Admin fazer upload (VERIFICAÇÃO DIRETA)
CREATE POLICY "Admin upload process-docs direct"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'process-docs' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política para Admin visualizar (VERIFICAÇÃO DIRETA)
CREATE POLICY "Admin view process-docs direct"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'process-docs' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política para Admin atualizar (VERIFICAÇÃO DIRETA)
CREATE POLICY "Admin update process-docs direct"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'process-docs' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'process-docs' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política para Admin deletar (VERIFICAÇÃO DIRETA)
CREATE POLICY "Admin delete process-docs direct"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'process-docs' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política para Cliente visualizar seus próprios documentos
CREATE POLICY "Client view own process-docs direct"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'process-docs' AND
  EXISTS (
    SELECT 1 FROM process_documents pd
    INNER JOIN processes p ON p.id = pd.process_id
    INNER JOIN profiles pr ON pr.email = p.client_email
    WHERE (pd.documents->>'file_path') = storage.objects.name
      AND pr.id = auth.uid()
  )
);

-- 3. VERIFICAÇÃO
SELECT 
  '✅ Políticas criadas' as status,
  COUNT(*) as total,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%process-docs%direct%';

-- 4. TESTAR SE ADMIN ESTÁ FUNCIONANDO
SELECT 
  'Teste Admin Direto' as tipo,
  auth.uid() as user_id,
  p.email,
  p.role,
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) as is_admin_direct,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    ) THEN '✅ ADMIN OK - Upload DEVE funcionar'
    ELSE '❌ NÃO É ADMIN'
  END as status
FROM profiles p
WHERE p.id = auth.uid();

-- 5. MENSAGEM FINAL
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔥🔥🔥 SOLUÇÃO DIRETA APLICADA! 🔥🔥🔥';
  RAISE NOTICE '';
  RAISE NOTICE 'Políticas criadas SEM função is_admin()';
  RAISE NOTICE 'Usa verificação DIRETA na política';
  RAISE NOTICE '';
  RAISE NOTICE 'AGORA:';
  RAISE NOTICE '1. Limpe o cache (Ctrl+Shift+R)';
  RAISE NOTICE '2. Faça logout e login novamente';
  RAISE NOTICE '3. Tente upload - DEVE FUNCIONAR!';
END $$;
