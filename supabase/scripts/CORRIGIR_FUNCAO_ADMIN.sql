-- ============================================
-- CORREÇÃO: Função is_admin() não está funcionando
-- Execute este script para recriar a função corretamente
-- ============================================

-- 1. Recriar a função usando CREATE OR REPLACE (não precisa fazer DROP)
-- IMPORTANTE: SECURITY DEFINER permite que a função execute com privilégios do criador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Verifica se o usuário atual tem role = 'admin'
  -- SECURITY DEFINER permite acessar a tabela profiles sem passar pelas políticas RLS
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
      AND role = 'admin'
  );
END;
$$;

-- 3. Garantir permissões corretas na função
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- 4. Verificar se a função foi criada
SELECT 
  proname as function_name,
  prosecdef as security_definer,
  proisstrict as is_strict,
  provolatile as volatility
FROM pg_proc
WHERE proname = 'is_admin'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 5. Testar a função (deve retornar true se você estiver logado como admin)
SELECT 
  auth.uid() as current_user_id,
  (SELECT email FROM profiles WHERE id = auth.uid()) as current_user_email,
  (SELECT role FROM profiles WHERE id = auth.uid()) as current_user_role,
  public.is_admin() as is_admin_result,
  CASE 
    WHEN public.is_admin() THEN '✅ Função funciona!'
    ELSE '❌ Função ainda não funciona'
  END as status;

-- 6. Garantir que o usuário admin@donna.com está como admin
UPDATE profiles 
SET role = 'admin'
WHERE email = 'admin@donna.com';

-- 7. Verificar todas as políticas que usam is_admin()
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual::text LIKE '%is_admin%' THEN '✅ Usa is_admin()'
    WHEN with_check::text LIKE '%is_admin%' THEN '✅ Usa is_admin()'
    ELSE '❌ NÃO usa is_admin()'
  END as usa_funcao
FROM pg_policies
WHERE tablename IN ('profiles', 'processes', 'process_documents')
  AND (qual::text LIKE '%is_admin%' OR with_check::text LIKE '%is_admin%')
ORDER BY tablename, policyname;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Função is_admin() recriada com SECURITY DEFINER';
  RAISE NOTICE '📋 Execute o teste acima para verificar se está funcionando';
  RAISE NOTICE '⚠️ IMPORTANTE: Faça logout e login novamente após executar este script';
END $$;
