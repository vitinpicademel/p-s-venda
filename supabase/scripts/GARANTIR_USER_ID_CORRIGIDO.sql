-- =====================================================
-- GARANTIR COLUNA user_id E VERIFICAR DADOS - VERSÃO CORRIGIDA
-- =====================================================

-- 1. Adicionar coluna user_id se não existir
ALTER TABLE processes 
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_processes_user_id ON processes(user_id);

-- 3. Verificar estrutura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'processes' AND column_name = 'user_id';

-- 4. Verificar dados existentes (versão simplificada)
SELECT 
    id,
    client_name,
    user_id,
    created_at,
    CASE 
        WHEN user_id IS NULL THEN 'SEM user_id'
        ELSE 'COM user_id'
    END as status_user_id
FROM processes 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Contar processos com e sem user_id
SELECT 
    COUNT(*) as total_processos,
    COUNT(user_id) as com_user_id,
    COUNT(*) - COUNT(user_id) as sem_user_id
FROM processes;

-- 6. Listar processos que precisam de user_id
SELECT id, client_name, created_at
FROM processes 
WHERE user_id IS NULL OR user_id = ''
ORDER BY created_at DESC;
