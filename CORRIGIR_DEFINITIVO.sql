-- CORREÇÃO DEFINITIVA DO ÚLTIMO PROCESSO

-- 1. Pegar o ID da lilian
SELECT id as lilian_id FROM profiles WHERE email = 'lilian@donnanegociacoes.com.br';

-- 2. Atualizar o último processo com o ID correto da lilian
UPDATE processes 
SET user_id = 'c6b5d8d1-5f3e-4a8b-9e2f-1a7b8c9d0e1f'
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
    user_id,
    created_at,
    CASE 
        WHEN user_id IS NOT NULL THEN 'CORRIGIDO!'
        ELSE 'AINDA NULL'
    END as status
FROM processes 
ORDER BY created_at DESC 
LIMIT 1;
