-- Criar usuário admin para julianamenezes@donnanegociacoes.com.br
-- Este script assume que o usuário já existe na autenticação do Supabase
-- Se não existir, precisa criar manualmente no Dashboard primeiro

-- 1. Garante que o perfil existe e está como admin
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  'Juliana Menezes',
  'admin'
FROM auth.users u
WHERE u.email = 'julianamenezes@donnanegociacoes.com.br'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  full_name = 'Juliana Menezes';

-- 2. Confirma o email (se necessário)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'julianamenezes@donnanegociacoes.com.br' 
  AND email_confirmed_at IS NULL;

-- 3. Verifica o resultado
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'julianamenezes@donnanegociacoes.com.br';
