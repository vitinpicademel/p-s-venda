-- ============================================
-- Script para verificar e corrigir usuário admin
-- Execute este script para verificar se o admin está configurado corretamente
-- ============================================

-- 1. Verificar se o usuário existe no auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'admin@donna.com';

-- 2. Verificar se o perfil existe e está como admin
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  u.email_confirmed_at
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.email = 'admin@donna.com';

-- 3. Se o perfil não existir ou não for admin, criar/corrigir
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  'Administrador',
  'admin'
FROM auth.users u
WHERE u.email = 'admin@donna.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  full_name = 'Administrador',
  email = EXCLUDED.email;

-- 4. Confirmar email se necessário
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'admin@donna.com' 
  AND email_confirmed_at IS NULL;

-- 5. Verificar resultado final
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role,
  p.full_name,
  CASE 
    WHEN p.role = 'admin' THEN '✅ Admin configurado corretamente'
    ELSE '❌ Role não é admin'
  END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@donna.com';
