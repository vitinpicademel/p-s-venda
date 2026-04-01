-- DEBUG PARA VERIFICAR SE user_id ESTÁ SENDO SALVO

-- 1. Verificar o processo mais recente (deve ser o que você acabou de criar)
SELECT 
    id, 
    client_name, 
    user_id,
    created_at,
    CASE 
        WHEN user_id IS NULL THEN 'PROBLEMA: user_id NULL!'
        WHEN user_id = '' THEN 'PROBLEMA: user_id VAZIO!'
        ELSE 'OK: user_id preenchido'
    END as status
FROM processes 
ORDER BY created_at DESC 
LIMIT 3;

-- 2. Verificar ID da Lilian novamente
SELECT id, email, role FROM profiles WHERE email = 'lilian@donnanegociacoes.com.br';

-- 3. Forçar o user_id no processo mais recente se estiver NULL
UPDATE processes 
SET user_id = (SELECT id FROM profiles WHERE email = 'lilian@donnanegociacoes.com.br' LIMIT 1)
WHERE id = (
    SELECT id FROM processes ORDER BY created_at DESC LIMIT 1
) AND user_id IS NULL;

-- 4. Verificar se funcionou
SELECT 
    id, 
    client_name, 
    user_id,
    created_at
FROM processes 
ORDER BY created_at DESC 
LIMIT 3;
