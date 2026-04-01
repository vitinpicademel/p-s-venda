-- =====================================================
-- CRIAÇÃO AUTOMÁTICA DE USUÁRIOS SECRETARIA
-- =====================================================
-- Este script cria TUDO automaticamente
-- Execute no SQL Editor do Supabase

-- =====================================================
-- PASSO 1: Habilitar extensão necessária (se não existir)
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PASSO 2: Obter instance_id correto
-- =====================================================
-- Primeiro, vamos descobrir o instance_id correto
DO $$
DECLARE
    instance_uuid UUID;
BEGIN
    -- Tentar obter instance_id da tabela auth.users existente
    SELECT instance_id INTO instance_uuid 
    FROM auth.users 
    LIMIT 1;
    
    -- Se não encontrar, usar um valor padrão
    IF instance_uuid IS NULL THEN
        instance_uuid := '00000000-0000-0000-0000-000000000000'::UUID;
        RAISE NOTICE 'Usando instance_id padrão: %', instance_uuid;
    ELSE
        RAISE NOTICE 'Instance_id encontrado: %', instance_uuid;
    END IF;
    
    -- Armazenar em uma variável temporária para uso posterior
    PERFORM set_config('app.instance_id', instance_uuid::text, true);
END $$;

-- =====================================================
-- PASSO 3: Criar usuários com instance_id dinâmico
-- =====================================================

-- Função para criar usuário se não existir
CREATE OR REPLACE FUNCTION create_secretaria_user(
    p_email TEXT,
    p_password TEXT DEFAULT 'Donna.123'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    instance_uuid UUID;
    user_uuid UUID;
    existing_user UUID;
BEGIN
    -- Obter instance_id
    SELECT current_setting('app.instance_id')::UUID INTO instance_uuid;
    
    -- Verificar se usuário já existe
    SELECT id INTO existing_user 
    FROM auth.users 
    WHERE email = p_email;
    
    IF existing_user IS NOT NULL THEN
        RETURN format('Usuário %s já existe', p_email);
    END IF;
    
    -- Gerar UUID para o novo usuário
    user_uuid := gen_random_uuid();
    
    -- Inserir usuário
    INSERT INTO auth.users (
        instance_id,
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        last_sign_in_at,
        raw_user_meta_data,
        is_super_admin
    ) VALUES (
        instance_uuid,
        user_uuid,
        p_email,
        crypt(p_password, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        NOW(),
        '{"role": "secretaria"}'::jsonb,
        false
    );
    
    -- Criar profile
    INSERT INTO profiles (
        id,
        email,
        role,
        created_at,
        updated_at
    ) VALUES (
        user_uuid,
        p_email,
        'secretaria',
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        role = 'secretaria',
        updated_at = NOW();
    
    RETURN format('Usuário %s criado com sucesso', p_email);
END;
$$;

-- =====================================================
-- PASSO 4: Criar os 4 usuários da Secretaria
-- =====================================================

SELECT create_secretaria_user('lilian@donnanegociacoes.com.br', 'Donna.123');
SELECT create_secretaria_user('jamaica@donnanegociacoes.com.br', 'Donna.123');
SELECT create_secretaria_user('thais@donnanegociacoes.com.br', 'Donna.123');
SELECT create_secretaria_user('preatendimento@donnanegociacoes.com.br', 'Donna.123');

-- =====================================================
-- PASSO 5: Verificação completa
-- =====================================================

-- Verificar usuários em auth.users
SELECT 
    'AUTH USERS' as tabela,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data->>'role' as role_metadata,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'CONFIRMED'
        ELSE 'NOT CONFIRMED'
    END as status
FROM auth.users 
WHERE email IN (
    'lilian@donnanegociacoes.com.br',
    'jamaica@donnanegociacoes.com.br',
    'thais@donnanegociacoes.com.br',
    'preatendimento@donnanegociacoes.com.br'
)
ORDER BY email;

-- Verificar profiles
SELECT 
    'PROFILES' as tabela,
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
ORDER BY email;

-- =====================================================
-- LIMPEZA (opcional)
-- =====================================================
-- DROP FUNCTION IF EXISTS create_secretaria_user(TEXT, TEXT);

-- =====================================================
-- TESTE DE LOGIN
-- =====================================================
/*
Após executar este script:

1. VERIFIQUE os resultados acima
2. TESTE o login:
   - URL: http://localhost:3000/login
   - Email: lilian@donnanegociacoes.com.br
   - Senha: Donna.123
   
3. Se der "usuário não encontrado":
   - Verifique se os resultados mostraram os emails
   - Verifique se email_confirmed_at não é nulo
   
4. Se der "senha incorreta":
   - Execute: UPDATE auth.users SET encrypted_password = crypt('Donna.123', gen_salt('bf')) WHERE email = 'email@dominio.com';
   
5. Se precisar redefinir senha:
   - Vá em Authentication > Users > clique no usuário > Reset Password
*/
