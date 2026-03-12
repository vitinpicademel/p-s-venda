-- CORRIGIR O NOVO PROCESSO CRIADO

-- 1. Verificar último processo criado
SELECT 
    id, 
    client_name, 
    client_email,
    user_id,
    created_at,
    CASE 
        WHEN user_id IS NULL THEN 'PROBLEMA: user_id NULL'
        ELSE 'OK: user_id presente'
    END as status
FROM processes 
ORDER BY created_at DESC 
LIMIT 1;

-- 2. Atualizar o último processo se user_id for NULL
UPDATE processes 
SET user_id = (
    SELECT p.id FROM profiles p 
    WHERE p.email = processes.client_email 
    AND p.role = 'secretaria'
    LIMIT 1
)
WHERE id = (
    SELECT id FROM processes 
    ORDER BY created_at DESC 
    LIMIT 1
)
AND user_id IS NULL;

-- 3. Verificar se corrigiu
SELECT 
    id, 
    client_name, 
    client_email,
    user_id,
    created_at,
    CASE 
        WHEN user_id IS NULL THEN 'AINDA NULL'
        ELSE 'CORRIGIDO'
    END as status
FROM processes 
ORDER BY created_at DESC 
LIMIT 1;
