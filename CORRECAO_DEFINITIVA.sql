-- CORREÇÃO DEFINITIVA - FORÇAR user_id EM TODOS OS PROCESSOS

-- 1. Pegar o ID da Lilian (secretaria)
SELECT id, email, role FROM profiles WHERE email = 'lilian@donnanegociacoes.com.br';

-- 2. Atualizar TODOS os processos sem user_id para o ID da Lilian
UPDATE processes 
SET user_id = (
    SELECT id FROM profiles WHERE email = 'lilian@donnanegociacoes.com.br' LIMIT 1
) 
WHERE user_id IS NULL OR user_id = '';

-- 3. Verificar o resultado
SELECT id, client_name, user_id, created_at FROM processes ORDER BY created_at DESC LIMIT 5;

-- 4. Contar quantos foram atualizados
SELECT COUNT(*) as processos_atualizados FROM processes WHERE user_id IS NOT NULL;
