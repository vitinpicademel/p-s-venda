-- SQL MINIMO - APENAS O ESSENCIAL

-- 1. Verificar se tabela existe
SELECT 'processes' as table_exists FROM information_schema.tables WHERE table_name = 'processes' LIMIT 1;

-- 2. Adicionar coluna sem verificação (se já existir, vai dar erro mas é seguro tentar)
ALTER TABLE processes ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 3. Verificar se coluna foi adicionada
SELECT column_name FROM information_schema.columns WHERE table_name = 'processes' AND column_name = 'user_id';

-- 4. Mostrar dados simples
SELECT id, client_name, user_id FROM processes ORDER BY created_at DESC LIMIT 3;
