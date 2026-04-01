-- ============================================
-- Script para testar e corrigir permissões do admin
-- Execute este script para verificar se as políticas estão funcionando
-- ============================================

-- 1. Verificar se a função is_admin() existe e funciona
SELECT 
  public.is_admin() as is_admin_result,
  auth.uid() as current_user_id;

-- 2. Verificar o role do usuário atual
SELECT 
  p.id,
  p.email,
  p.role,
  CASE 
    WHEN p.role = 'admin' THEN '✅ É admin'
    ELSE '❌ NÃO é admin'
  END as status
FROM profiles p
WHERE p.id = auth.uid();

-- 3. Testar se consegue ver processos (deve retornar algo se for admin)
SELECT COUNT(*) as total_processos
FROM processes;

-- 4. Verificar políticas ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('profiles', 'processes', 'process_documents')
ORDER BY tablename, policyname;

-- 5. Se a função is_admin() não existir, criar
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6. Garantir que o usuário admin@donna.com está como admin
UPDATE profiles 
SET role = 'admin'
WHERE email = 'admin@donna.com';

-- 7. Verificar resultado final
SELECT 
  'Verificação de Permissões' as teste,
  CASE 
    WHEN public.is_admin() THEN '✅ Função is_admin() funciona'
    ELSE '❌ Função is_admin() NÃO funciona'
  END as status_funcao,
  (SELECT role FROM profiles WHERE email = 'admin@donna.com') as role_admin,
  (SELECT COUNT(*) FROM processes) as processos_visiveis;
