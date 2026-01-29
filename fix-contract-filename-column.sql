-- ============================================
-- Adicionar coluna contract_filename se não existir
-- Execute isso no SQL Editor do Supabase
-- ============================================

-- Verifica se a coluna existe e adiciona se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'processes' 
        AND column_name = 'contract_filename'
    ) THEN
        ALTER TABLE processes 
        ADD COLUMN contract_filename TEXT;
        
        RAISE NOTICE 'Coluna contract_filename adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna contract_filename já existe.';
    END IF;
END $$;

-- Verifica todas as colunas da tabela processes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'processes'
ORDER BY ordinal_position;

