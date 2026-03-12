-- PEGAR O ID DA LILIAN DE FORMA SIMPLES

SELECT id, email, role FROM profiles WHERE email = 'lilian@donnanegociacoes.com.br';

-- Mostrar também o último processo para confirmar
SELECT id, client_name, user_id, created_at FROM processes ORDER BY created_at DESC LIMIT 1;
