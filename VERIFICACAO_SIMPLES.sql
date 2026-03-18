-- VERIFICAÇÃO SIMPLES - MOSTRAR EXATAMENTE O QUE PRECISAMOS

-- 1. Verificar ID da Lilian (secretaria)
SELECT id, email, role FROM profiles WHERE email = 'lilian@donnanegociacoes.com.br';

-- 2. Criar um processo de TESTE para a Lilian
INSERT INTO processes (
    id, 
    user_id, 
    client_name, 
    client_email, 
    status, 
    created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'lilian@donnanegociacoes.com.br' LIMIT 1),
    'PROCESSO DE TESTE LILIAN',
    'teste@lilian.com',
    'in_progress',
    NOW()
);

-- 3. Verificar todos os processos com user_id
SELECT 
    id, 
    client_name, 
    user_id,
    CASE 
        WHEN user_id IS NULL THEN 'SEM DONO (APENAS ADMIN)'
        ELSE 'DONO: ' || user_id
    END as status,
    created_at
FROM processes 
ORDER BY created_at DESC;
