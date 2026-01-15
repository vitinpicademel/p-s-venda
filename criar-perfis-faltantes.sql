-- ============================================
-- Script para criar perfis para usuários que não têm perfil
-- Execute isso no SQL Editor do Supabase
-- ============================================

-- Cria perfis para todos os usuários que não têm perfil ainda
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  COALESCE(u.raw_user_meta_data->>'role', 'client')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verifica quantos perfis foram criados
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(p.id) as total_perfis,
  COUNT(*) - COUNT(p.id) as perfis_faltantes
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- Lista todos os usuários e seus perfis
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.id as profile_id,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

