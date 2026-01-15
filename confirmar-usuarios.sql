-- ============================================
-- Script para confirmar todos os usuários existentes
-- Execute isso no SQL Editor do Supabase
-- ============================================

-- Confirma todos os usuários que ainda não foram confirmados
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Verifica quais usuários foram confirmados
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;

