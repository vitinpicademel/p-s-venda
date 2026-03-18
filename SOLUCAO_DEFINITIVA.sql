-- ============================================
-- SOLUÇÃO DEFINITIVA: Corrigir permissões de uma vez
-- Execute este script COMPLETO para resolver todos os problemas
-- ============================================

-- 1. DESABILITAR RLS TEMPORARIAMENTE para recriar tudo
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE processes DISABLE ROW LEVEL SECURITY;
ALTER TABLE process_documents DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLÍTICAS ANTIGAS
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles', 'processes', 'process_documents')) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 3. RECRIAR FUNÇÃO is_admin() com configuração correta
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

-- 4. GARANTIR PERMISSÕES
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- 5. HABILITAR RLS NOVAMENTE
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_documents ENABLE ROW LEVEL SECURITY;

-- 6. CRIAR POLÍTICAS SIMPLES E DIRETAS

-- Profiles: usuários podem ver/editar seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Profiles: admins podem ver todos
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

-- Processes: admins podem tudo
CREATE POLICY "Admins can view all processes"
  ON processes FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can create processes"
  ON processes FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update processes"
  ON processes FOR UPDATE
  USING (public.is_admin());

-- Processes: clientes podem ver seus próprios processos
-- Usa profiles ao invés de auth.users para evitar erro de permissão
CREATE POLICY "Clients can view own processes"
  ON processes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.email = processes.client_email
    )
  );

-- Process_documents: admins podem tudo
CREATE POLICY "Admins can view all documents"
  ON process_documents FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can create documents"
  ON process_documents FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update documents"
  ON process_documents FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete documents"
  ON process_documents FOR DELETE
  USING (public.is_admin());

-- Process_documents: clientes podem ver documentos de seus processos
-- Usa profiles ao invés de auth.users para evitar erro de permissão
CREATE POLICY "Clients can view own documents"
  ON process_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM processes p
      INNER JOIN profiles pr ON pr.email = p.client_email
      WHERE p.id = process_documents.process_id
        AND pr.id = auth.uid()
    )
  );

-- 7. GARANTIR QUE ADMIN ESTÁ CONFIGURADO
UPDATE profiles 
SET role = 'admin'
WHERE email = 'admin@donna.com';

-- 8. VERIFICAÇÃO FINAL
SELECT 
  '✅ Configuração Completa' as status,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as admins,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles', 'processes', 'process_documents')) as total_policies,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'is_admin') as funcao_existe;

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '✅✅✅ TUDO CONFIGURADO! ✅✅✅';
  RAISE NOTICE '1. Limpe os cookies do navegador';
  RAISE NOTICE '2. Faça logout e login novamente';
  RAISE NOTICE '3. Teste criar um processo';
END $$;
