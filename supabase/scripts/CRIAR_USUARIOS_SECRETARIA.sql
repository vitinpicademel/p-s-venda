-- =====================================================
-- CRIAÇÃO DE USUÁRIOS SECRETARIA EM LOTE
-- =====================================================
-- Execute este script diretamente no painel do Supabase:
-- 1. Vá para SQL Editor
-- 2. Cole este script
-- 3. Clique em "Run"

-- NOTA: Este script usa a service role function para criar usuários
-- Se der erro, você pode precisar habilitar a extensão 'pgcrypto'
-- ou criar os usuários manualmente pelo painel Authentication

-- =====================================================
-- PASSO 1: Criar função auxiliar se não existir
-- =====================================================
CREATE OR REPLACE FUNCTION create_user_if_not_exists(
    p_email TEXT,
    p_password TEXT,
    p_role TEXT DEFAULT 'secretaria'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    profile_id UUID;
BEGIN
    -- Verificar se usuário já existe no auth.users
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = p_email;
    
    IF user_id IS NULL THEN
        -- Criar usuário no auth.users
        INSERT INTO auth.users (
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            last_sign_in_at,
            raw_user_meta_data
        ) VALUES (
            p_email,
            crypt(p_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            NOW(),
            jsonb_build_object('role', p_role)
        ) RETURNING id INTO user_id;
        
        RETURN format('Usuário %s criado com ID: %s', p_email, user_id);
    ELSE
        -- Usuário já existe, apenas atualizar profile se necessário
        RETURN format('Usuário %s já existe com ID: %s', p_email, user_id);
    END IF;
    
    -- Criar ou atualizar profile
    INSERT INTO profiles (
        id,
        email,
        role,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        p_email,
        p_role,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        role = p_role,
        updated_at = NOW();
    
    RETURN format('Usuário %s e profile criados/atualizados', p_email);
END;
$$;

-- =====================================================
-- PASSO 2: Criar os usuários da Secretaria
-- =====================================================

-- Senha padrão para todos
-- IMPORTANTE: Em produção, use senhas mais seguras!
\set password 'Donna.123'

-- Lilian
SELECT create_user_if_not_exists('lilian@donnanegociacoes.com.br', :'password', 'secretaria');

-- Jamaica  
SELECT create_user_if_not_exists('jamaica@donnanegociacoes.com.br', :'password', 'secretaria');

-- Thais
SELECT create_user_if_not_exists('thais@donnanegociacoes.com.br', :'password', 'secretaria');

-- Pré-atendimento
SELECT create_user_if_not_exists('preatendimento@donnanegociacoes.com.br', :'password', 'secretaria');

-- =====================================================
-- PASSO 3: Verificar resultados
-- =====================================================

-- Verificar usuários criados na tabela auth.users
SELECT 
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at,
    raw_user_meta_data->>'role' as role_from_metadata
FROM auth.users 
WHERE email IN (
    'lilian@donnanegociacoes.com.br',
    'jamaica@donnanegociacoes.com.br', 
    'thais@donnanegociacoes.com.br',
    'preatendimento@donnanegociacoes.com.br'
)
ORDER BY created_at DESC;

-- Verificar profiles criados
SELECT 
    email,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE email IN (
    'lilian@donnanegociacoes.com.br',
    'jamaica@donnanegociacoes.com.br', 
    'thais@donnanegociacoes.com.br',
    'preatendimento@donnanegociacoes.com.br'
)
ORDER BY created_at DESC;

-- =====================================================
-- PASSO 4: Limpeza (opcional)
-- =====================================================

-- Se quiser remover a função auxiliar (opcional)
-- DROP FUNCTION IF EXISTS create_user_if_not_exists(TEXT, TEXT, TEXT);

-- =====================================================
-- INSTRUÇÕES FINAIS
-- =====================================================
/*
Após executar este script:

1. VERIFIQUE os resultados nas duas consultas acima
2. TESTE o login com:
   - Email: lilian@donnanegociacoes.com.br
   - Senha: Donna.123
   
3. Se der erro de "usuário não encontrado", verifique:
   - Se as linhas apareceram nos resultados
   - Se email_confirmed_at não é nulo
   
4. Se os usuários aparecerem mas não conseguirem fazer login:
   - Tente redefinir a senha pelo painel Authentication
   - Ou execute: UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'email@dominio.com';

5. Se precisar alterar a role de algum usuário:
   UPDATE profiles SET role = 'secretaria' WHERE email = 'email@dominio.com';
*/
