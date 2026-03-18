-- =====================================================
-- ATUALIZAR PROFILES PARA SECRETARIA
-- =====================================================
-- Execute APÓS criar os usuários manualmente pelo painel

-- Criar/atualizar profiles com role secretaria
INSERT INTO profiles (id, email, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    'secretaria' as role,
    au.created_at,
    NOW()
FROM auth.users au
WHERE au.email IN (
    'lilian@donnanegociacoes.com.br',
    'jamaica@donnanegociacoes.com.br',
    'thais@donnanegociacoes.com.br',
    'preatendimento@donnanegociacoes.com.br'
)
ON CONFLICT (id) DO UPDATE SET
    role = 'secretaria',
    updated_at = NOW();

-- Verificar resultado
SELECT 
    p.email,
    p.role,
    p.created_at,
    p.updated_at
FROM profiles p
WHERE p.email IN (
    'lilian@donnanegociacoes.com.br',
    'jamaica@donnanegociacoes.com.br',
    'thais@donnanegociacoes.com.br',
    'preatendimento@donnanegociacoes.com.br'
)
ORDER BY p.email;

-- =====================================================
-- INSTRUÇÕES
-- =====================================================
/*
1. Primeiro crie os 4 usuários manualmente pelo painel Authentication
2. Depois execute este script SQL
3. Teste o login com:
   - Email: lilian@donnanegociacoes.com.br
   - Senha: Donna.123
4. Verifique se a role aparece como 'secretaria'
*/
