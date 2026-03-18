-- =====================================================
-- CRIAÇÃO SIMPLES DE USUÁRIOS SECRETARIA
-- =====================================================
-- Versão simplificada que funciona na maioria dos casos
-- Execute este script diretamente no painel do Supabase

-- =====================================================
-- MÉTODO 1: Inserir direto na tabela auth.users (se tiver permissão)
-- =====================================================

-- Tentar criar usuários diretamente
INSERT INTO auth.users (
    instance_id,
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_user_meta_data
) VALUES 
(
    '00000000-0000-0000-0000-000000000000', -- instance_id padrão
    gen_random_uuid(),
    'lilian@donnanegociacoes.com.br',
    crypt('Donna.123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '{"role": "secretaria"}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'jamaica@donnanegociacoes.com.br',
    crypt('Donna.123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '{"role": "secretaria"}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'thais@donnanegociacoes.com.br',
    crypt('Donna.123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '{"role": "secretaria"}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'preatendimento@donnanegociacoes.com.br',
    crypt('Donna.123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '{"role": "secretaria"}'::jsonb
)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- MÉTODO 2: Criar profiles correspondentes
-- =====================================================

-- Criar profiles para os usuários
INSERT INTO profiles (id, email, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'role', 'secretaria') as role,
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE au.email IN (
    'lilian@donnanegociacoes.com.br',
    'jamaica@donnanegociacoes.com.br',
    'thais@donnanegociacoes.com.br',
    'preatendimento@donnanegociacoes.com.br'
)
AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = au.id
);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar usuários criados
SELECT 
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data->>'role' as role
FROM auth.users 
WHERE email IN (
    'lilian@donnanegociacoes.com.br',
    'jamaica@donnanegociacoes.com.br',
    'thais@donnanegociacoes.com.br',
    'preatendimento@donnanegociacoes.com.br'
);

-- Verificar profiles
SELECT 
    email,
    role,
    created_at
FROM profiles 
WHERE email IN (
    'lilian@donnanegociacoes.com.br',
    'jamaica@donnanegociacoes.com.br',
    'thais@donnanegociacoes.com.br',
    'preatendimento@donnanegociacoes.com.br'
);

-- =====================================================
-- SE DER ERRO TENTE ISTO:
-- =====================================================

-- Se o método acima der erro, tente criar manualmente:
-- 1. Vá em Authentication > Users
-- 2. Clique "Add user"
-- 3. Preencha:
--    - Email: lilian@donnanegociacoes.com.br
--    - Password: Donna.123
--    - Auto-confirm: marque
-- 4. Repita para os outros 3 emails
-- 5. Depois execute apenas o INSERT INTO profiles acima
