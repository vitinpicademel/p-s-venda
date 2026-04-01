-- =====================================================
-- GARANTIR COLUNA user_id E VERIFICAR DADOS
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

-- 4. Verificar dados existentes
SELECT 
    id,
    client_name,
    user_id,
    created_at,
    CASE 
        WHEN user_id IS NULL THEN 'SEM user_id'
        WHEN user_id = '' THEN 'user_id VAZIO'
        ELSE 'user_id OK'
    END as status_user_id
FROM processes 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Contar processos com e sem user_id
SELECT 
    COUNT(*) as total_processos,
    COUNT(CASE WHEN user_id IS NOT NULL AND user_id != '' THEN 1 END) as com_user_id,
    COUNT(CASE WHEN user_id IS NULL OR user_id = '' THEN 1 END) as sem_user_id
FROM processes;

-- 6. Se houver processos sem user_id, mostrar para atualização manual
SELECT 'Processos que precisam de user_id:' as info;
SELECT id, client_name, created_at
FROM processes 
WHERE user_id IS NULL OR user_id = ''
ORDER BY created_at DESC;
