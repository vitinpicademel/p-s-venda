-- SOLUÇÃO FINAL SECRETARIA - VERIFICAÇÃO COMPLETA

-- 1. Verificar qual é o ID da Lilian (secretaria logada)
SELECT id, email, role FROM profiles WHERE email = 'lilian@donnanegociacoes.com.br';

-- 2. Verificar processos existentes e seus user_ids
SELECT 
    id, 
    client_name, 
    user_id,
    CASE 
        WHEN user_id IS NULL THEN 'SEM DONO'
        ELSE 'COM DONO'
    END as status_dono,
    created_at
FROM processes 
ORDER BY created_at DESC;

-- 3. Forçar user_id da Lilian em todos os processos sem dono
UPDATE processes 
SET user_id = (
    SELECT id FROM profiles WHERE email = 'lilian@donnanegociacoes.com.br' LIMIT 1
) 
WHERE user_id IS NULL;

-- 4. Verificar resultado final
SELECT 
    id, 
    client_name, 
    user_id,
    created_at
FROM processes 
ORDER BY created_at DESC;
