-- =====================================================
-- VERIFICAÇÃO FINAL - PASSO A PASSO SEGURO
-- =====================================================

-- PASSO 1: Verificar se tabela processes existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'processes' AND table_schema = 'public';

-- PASSO 2: Verificar estrutura atual da tabela processes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'processes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASSO 3: Adicionar coluna user_id (se não existir) - FORMA SEGURA
DO $$
BEGIN
    -- Verificar se a coluna existe antes de adicionar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'processes' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE processes ADD COLUMN user_id TEXT;
        RAISE NOTICE 'Coluna user_id adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna user_id já existe';
    END IF;
END $$;

-- PASSO 4: Verificar se a coluna foi adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'processes' 
AND column_name = 'user_id' 
AND table_schema = 'public';

-- PASSO 5: Verificar dados existentes de forma simples
SELECT 
    id, 
    client_name, 
    COALESCE(user_id, 'NULL') as user_id_status,
    created_at
FROM processes 
ORDER BY created_at DESC 
LIMIT 5;

-- PASSO 6: Contagem simples
SELECT 
    COUNT(*) as total,
    COUNT(user_id) as com_user_id,
    COUNT(*) - COUNT(user_id) as sem_user_id
FROM processes;

-- PASSO 7: Processos que precisam de user_id
SELECT id, client_name, created_at
FROM processes 
WHERE user_id IS NULL
ORDER BY created_at DESC;
