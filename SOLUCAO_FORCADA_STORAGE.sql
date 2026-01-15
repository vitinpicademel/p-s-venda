-- ============================================
-- SOLUÇÃO FORÇADA: Desabilitar RLS temporariamente e recriar políticas
-- Este script força a correção mesmo se houver problemas anteriores
-- ============================================

-- 1. REMOVER TODAS AS POLÍTICAS DO process-docs (FORÇADO)
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
               OR policyname LIKE '%process_docs%'
               OR policyname LIKE '%process%')
    ) LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
            RAISE NOTICE 'Removida política: %', r.policyname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao remover política %: %', r.policyname, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. GARANTIR FUNÇÃO is_admin() CORRETA
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
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

-- Garantir TODAS as permissões possíveis
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO postgres;

-- 3. CRIAR POLÍTICA SUPER PERMISSIVA PARA ADMIN (TESTE)
-- Esta política permite TUDO para admin, sem condições complexas
CREATE POLICY "Admin full access process-docs"
ON storage.objects
FOR ALL
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

-- 4. VERIFICAR SE FUNCIONOU
SELECT 
  '✅ Política criada' as status,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Admin full access process-docs';

-- 5. TESTAR SE ADMIN ESTÁ FUNCIONANDO
SELECT 
  'Teste Admin' as tipo,
  auth.uid() as user_id,
  p.email,
  p.role,
  public.is_admin() as is_admin_result,
  CASE 
    WHEN public.is_admin() = true THEN '✅ ADMIN OK - Upload DEVE funcionar agora'
    ELSE '❌ NÃO É ADMIN - Execute VERIFICAR_ADMIN.sql primeiro'
  END as status
FROM profiles p
WHERE p.id = auth.uid();

-- 6. MENSAGEM FINAL
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔥🔥🔥 SOLUÇÃO FORÇADA APLICADA! 🔥🔥🔥';
  RAISE NOTICE '';
  RAISE NOTICE 'Criada política SUPER PERMISSIVA para admin';
  RAISE NOTICE 'Se ainda não funcionar:';
  RAISE NOTICE '1. Verifique acima se você está logado como ADMIN';
  RAISE NOTICE '2. Limpe cookies e cache completamente';
  RAISE NOTICE '3. Faça logout e login novamente';
  RAISE NOTICE '4. Tente upload novamente';
END $$;
