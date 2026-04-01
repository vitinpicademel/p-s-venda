-- ============================================
-- SOLUÇÃO FINAL: Corrigir todas as permissões
-- Execute este script para resolver definitivamente os erros de permissão
-- ============================================

-- 1. Recriar função is_admin() com SET search_path para garantir que funcione
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Verifica se o usuário atual tem role = 'admin'
  -- SECURITY DEFINER + SET search_path garante acesso correto
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
      AND role = 'admin'
  );
END;
$$;

-- 2. Garantir permissões na função
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- 3. Recriar TODAS as políticas usando a função corrigida

-- Policies para profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

-- Policies para processes
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

-- Policies para process_documents
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

-- 4. Garantir que o usuário admin@donna.com está como admin
UPDATE profiles 
SET role = 'admin'
WHERE email = 'admin@donna.com';

-- 5. Verificar se RLS está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_documents ENABLE ROW LEVEL SECURITY;

-- 6. Verificar resultado
SELECT 
  'Configuração Final' as status,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('profiles', 'processes', 'process_documents') AND qual::text LIKE '%is_admin%') as politicas_com_funcao,
  CASE 
    WHEN (SELECT prosecdef FROM pg_proc WHERE proname = 'is_admin' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN '✅ Função com SECURITY DEFINER'
    ELSE '❌ Função sem SECURITY DEFINER'
  END as status_funcao;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Todas as políticas foram recriadas!';
  RAISE NOTICE '⚠️ IMPORTANTE: Faça logout e login novamente na aplicação';
  RAISE NOTICE '⚠️ Limpe os cookies do navegador se necessário';
END $$;
