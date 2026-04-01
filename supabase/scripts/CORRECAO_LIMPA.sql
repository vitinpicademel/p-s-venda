-- CORREÇÃO LIMPA - REMOVER user_id FORÇADO DOS PROCESSOS ANTIGOS

-- 1. Verificar ID da Lilian
SELECT id, email, role FROM profiles WHERE email = 'lilian@donnanegociacoes.com.br';

-- 2. LIMPAR user_id dos processos existentes (deixar NULL para não editar)
UPDATE processes 
SET user_id = NULL 
WHERE user_id IS NOT NULL;

-- 3. Verificar que todos estão sem user_id agora
SELECT 
    id, 
    client_name, 
    user_id,
    created_at
FROM processes 
ORDER BY created_at DESC;

-- 4. Contar processos sem user_id
SELECT COUNT(*) as processos_sem_dono FROM processes WHERE user_id IS NULL;
