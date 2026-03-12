-- VERIFICAÇÃO REAL - O QUE ESTÁ ACONTECENDO

-- 1. Verificar o último processo criado AGORA
SELECT 
    id, 
    client_name, 
    client_email,
    user_id,
    created_at,
    CASE 
        WHEN user_id IS NULL THEN 'PROBLEMA: user_id NULL'
        ELSE 'OK: user_id = ' || user_id
    END as status
FROM processes 
ORDER BY created_at DESC 
LIMIT 3;

-- 2. Verificar qual é o user_id da lilian
SELECT id, email, role FROM profiles WHERE email = 'lilian@donnanegociacoes.com.br';

-- 3. Verificar se o user_id do processo bate com o user_id do perfil
SELECT 
    p.id as processo_id,
    p.client_name,
    p.user_id as processo_user_id,
    pr.id as perfil_id,
    pr.email,
    pr.role,
    CASE 
        WHEN p.user_id = pr.id THEN 'OK - BATE'
        ELSE 'ERRO - NÃO BATE'
    END as compatibilidade
FROM processes p
JOIN profiles pr ON pr.email = p.client_email
WHERE pr.role = 'secretaria'
ORDER BY p.created_at DESC
LIMIT 3;
