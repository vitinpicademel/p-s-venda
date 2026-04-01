-- ============================================
-- SOLUÇÃO DE EMERGÊNCIA: Permitir TUDO para authenticated users
-- Use apenas se NADA mais funcionar
-- ============================================

-- 1. REMOVER TODAS AS POLÍTICAS DO process-docs
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

-- 2. CRIAR POLÍTICA SUPER PERMISSIVA PARA USUÁRIOS AUTENTICADOS
-- ATENÇÃO: Isso permite que QUALQUER usuário autenticado faça upload
-- Use apenas temporariamente para testar

-- Política para QUALQUER usuário autenticado fazer upload
CREATE POLICY "Authenticated users can upload process-docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'process-docs' 
  AND auth.role() = 'authenticated'
);

-- Política para QUALQUER usuário autenticado visualizar
CREATE POLICY "Authenticated users can view process-docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'process-docs' 
  AND auth.role() = 'authenticated'
);

-- Política para QUALQUER usuário autenticado atualizar
CREATE POLICY "Authenticated users can update process-docs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'process-docs' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'process-docs' 
  AND auth.role() = 'authenticated'
);

-- Política para QUALQUER usuário autenticado deletar
CREATE POLICY "Authenticated users can delete process-docs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'process-docs' 
  AND auth.role() = 'authenticated'
);

-- 3. VERIFICAÇÃO
SELECT 
  '✅ Políticas de emergência criadas' as status,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%process-docs%';

-- 4. MENSAGEM
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⚠️⚠️⚠️ SOLUÇÃO DE EMERGÊNCIA APLICADA! ⚠️⚠️⚠️';
  RAISE NOTICE '';
  RAISE NOTICE 'ATENÇÃO: Qualquer usuário autenticado pode fazer upload';
  RAISE NOTICE 'Use apenas para testar. Depois restrinja novamente.';
  RAISE NOTICE '';
  RAISE NOTICE 'AGORA TESTE O UPLOAD - DEVE FUNCIONAR!';
END $$;
