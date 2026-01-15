-- ============================================
-- CORREÇÃO DEFINITIVA: Políticas de Storage para process-docs
-- Este script força a recriação de todas as políticas
-- ============================================

-- 1. REMOVER TODAS AS POLÍTICAS ANTIGAS DO process-docs
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects'
          AND (policyname LIKE '%process-docs%' OR policyname LIKE '%process_docs%')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
    END LOOP;
END $$;

-- 2. GARANTIR QUE A FUNÇÃO is_admin() EXISTE E ESTÁ CORRETA
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

-- 3. GARANTIR PERMISSÕES
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO postgres;

-- 4. VERIFICAR SE O BUCKET EXISTE (se não existir, criar)
-- Nota: Não podemos criar bucket via SQL, mas podemos verificar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'process-docs') THEN
        RAISE NOTICE '⚠️ ATENÇÃO: O bucket process-docs não existe! Crie-o manualmente no Dashboard > Storage';
    ELSE
        RAISE NOTICE '✅ Bucket process-docs existe';
    END IF;
END $$;

-- 5. CRIAR POLÍTICAS NOVAS (FORÇANDO RECRIAÇÃO)

-- Política para Admin fazer upload
CREATE POLICY "Admins can upload process-docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'process-docs' 
  AND public.is_admin() = true
);

-- Política para Admin visualizar
CREATE POLICY "Admins can view all process-docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'process-docs' 
  AND public.is_admin() = true
);

-- Política para Admin atualizar
CREATE POLICY "Admins can update process-docs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'process-docs' 
  AND public.is_admin() = true
);

-- Política para Admin deletar
CREATE POLICY "Admins can delete process-docs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'process-docs' 
  AND public.is_admin() = true
);

-- Política para Cliente visualizar seus próprios documentos
CREATE POLICY "Clients can view their own process-docs"
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

-- 6. VERIFICAÇÃO FINAL
SELECT 
  '✅ Políticas criadas' as status,
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as policies_insert,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as policies_select,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as policies_update,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as policies_delete
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname LIKE '%process-docs%' OR policyname LIKE '%process_docs%');

-- 7. TESTAR SE O USUÁRIO ATUAL É ADMIN
SELECT 
  'Status do Usuário' as tipo,
  auth.uid() as user_id,
  p.email,
  p.role,
  public.is_admin() as is_admin_result,
  CASE 
    WHEN public.is_admin() = true THEN '✅ VOCÊ É ADMIN - Upload deve funcionar'
    ELSE '❌ VOCÊ NÃO É ADMIN - Faça login como admin@donna.com'
  END as status
FROM profiles p
WHERE p.id = auth.uid();

-- 8. MENSAGEM FINAL
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ POLÍTICAS RECRIADAS COM SUCESSO! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Verifique acima se você está logado como ADMIN';
  RAISE NOTICE '2. Se não for admin, faça logout e login como admin@donna.com';
  RAISE NOTICE '3. Limpe o cache do navegador (Ctrl+Shift+R)';
  RAISE NOTICE '4. Tente fazer upload novamente';
END $$;
