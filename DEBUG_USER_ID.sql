-- DEBUG - VERIFICAR user_id NO PROCESSO RECENTE

-- 1. Verificar último processo criado
SELECT 
    id, 
    client_name, 
    user_id,
    created_at,
    CASE 
        WHEN user_id IS NULL THEN 'PROBLEMA: user_id NULL'
        ELSE 'OK: user_id presente'
    END as status
FROM processes 
ORDER BY created_at DESC 
LIMIT 1;

-- 2. Verificar todos os processos recentes
SELECT 
    COUNT(*) as total,
    COUNT(user_id) as com_user_id,
    COUNT(*) - COUNT(user_id) as sem_user_id
FROM processes 
WHERE created_at >= NOW() - INTERVAL '1 hour';

-- 3. Se user_id estiver NULL, vamos atualizar manualmente o último processo
UPDATE processes 
SET user_id = (
    SELECT id FROM profiles 
    WHERE email = 'lilian@donnanegociacoes.com.br' 
    LIMIT 1
)
WHERE user_id IS NULL 
AND id = (
    SELECT id FROM processes 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- 4. Verificar se atualizou
SELECT id, client_name, user_id, created_at
FROM processes 
ORDER BY created_at DESC 
LIMIT 1;
