-- CORRIGIR user_id PARA TODOS OS SECRETARIA

-- 1. Atualizar TODOS os processos sem user_id para o respectivo dono
UPDATE processes 
SET user_id = (
    SELECT p.id FROM profiles p 
    WHERE p.email = processes.client_email 
    AND p.role = 'secretaria'
    LIMIT 1
)
WHERE user_id IS NULL 
AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.email = processes.client_email 
    AND p.role = 'secretaria'
);

-- 2. Verificar quantos foram atualizados
SELECT 
    COUNT(*) as total_atualizados
FROM processes 
WHERE user_id IS NOT NULL 
AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.email = processes.client_email 
    AND p.role = 'secretaria'
);

-- 3. Mostrar processos de secretaria atualizados
SELECT 
    pr.id,
    pr.client_name,
    pr.client_email,
    pr.user_id,
    p.role as user_role,
    pr.created_at
FROM processes pr
JOIN profiles p ON p.id = pr.user_id
WHERE p.role = 'secretaria'
ORDER BY pr.created_at DESC;

-- 4. Contar processos de secretaria com e sem user_id
SELECT 
    COUNT(*) as total_secretaria,
    COUNT(pr.user_id) as com_user_id,
    COUNT(*) - COUNT(pr.user_id) as sem_user_id
FROM processes pr
JOIN profiles p ON p.email = pr.client_email 
WHERE p.role = 'secretaria';
