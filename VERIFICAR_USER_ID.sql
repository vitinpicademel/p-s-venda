-- =====================================================
-- VERIFICAR SE A COLUNA user_id EXISTE NA TABELA processes
-- =====================================================

-- 1. Verificar estrutura da tabela processes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'processes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar se a coluna user_id existe especificamente
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'processes' 
AND column_name = 'user_id';

-- 3. Se não existir, adicionar a coluna user_id
-- (Descomente as linhas abaixo se a coluna não existir)
/*
ALTER TABLE processes 
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_processes_user_id ON processes(user_id);
*/

-- 4. Verificar dados existentes (se houver)
SELECT 
    id,
    client_name,
    user_id,
    created_at
FROM processes 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Contar processos com e sem user_id
SELECT 
    COUNT(*) as total_processos,
    COUNT(user_id) as processos_com_user_id,
    COUNT(*) - COUNT(user_id) as processos_sem_user_id
FROM processes;
