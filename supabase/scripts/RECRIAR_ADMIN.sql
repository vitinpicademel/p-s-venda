-- ============================================
-- SCRIPT PARA CRIAR USUÁRIO ADMIN
-- Execute este SQL APÓS criar o usuário no Authentication
-- ============================================

-- IMPORTANTE: Primeiro crie o usuário no Supabase Dashboard:
-- 1. Authentication → Users → Add user → Create new user
-- 2. Email: admin@donna.com
-- 3. Password: (defina uma senha forte)
-- 4. Auto Confirm User: ✅ MARCADO
-- 5. Depois execute este SQL

-- Garante que o perfil existe e está como admin
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

-- Confirma o email (se necessário)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'admin@donna.com' 
  AND email_confirmed_at IS NULL;

-- Verifica o resultado
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@donna.com';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Usuário admin criado/atualizado com sucesso!';
  RAISE NOTICE '📧 Email: admin@donna.com';
  RAISE NOTICE '🔑 Use a senha que você definiu no Dashboard';
END $$;
