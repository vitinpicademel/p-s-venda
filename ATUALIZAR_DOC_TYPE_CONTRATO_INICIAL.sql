-- ============================================
-- ATUALIZAR: Adicionar 'contrato_inicial' como valor válido de doc_type
-- Permite salvar o contrato inicial na tabela process_documents
-- ============================================

-- 1. Remover constraint antiga se existir
ALTER TABLE process_documents 
DROP CONSTRAINT IF EXISTS process_documents_doc_type_check;

-- 2. Adicionar nova constraint com 'contrato_inicial' incluído
ALTER TABLE process_documents 
ADD CONSTRAINT process_documents_doc_type_check 
CHECK (doc_type IN ('contrato_inicial', 'dossie_comprador', 'dossie_vendedor'));

-- 3. Verificar se a constraint foi aplicada
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'process_documents'::regclass
  AND conname = 'process_documents_doc_type_check';
