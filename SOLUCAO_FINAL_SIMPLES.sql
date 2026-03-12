-- SOLUÇÃO FINAL SIMPLES - SEM COMPLICAÇÃO

-- 1. Verificar o que temos agora
SELECT id, client_name, user_id FROM processes ORDER BY created_at DESC LIMIT 3;

-- 2. Pegar TODOS os processos de secretaria e atualizar com o ID correto
UPDATE processes 
SET user_id = (
    SELECT p.id FROM profiles p 
    WHERE p.email = 'lilian@donnanegociacoes.com.br'
    LIMIT 1
)
WHERE client_email = 'lilian@donnanegociacoes.com.br';

-- 3. Verificar se funcionou
SELECT id, client_name, user_id, 
       CASE WHEN user_id IS NOT NULL THEN 'FUNCIONOU!' ELSE 'FALHOU!' END as resultado
FROM processes 
WHERE client_email = 'lilian@donnanegociacoes.com.br'
ORDER BY created_at DESC;
