-- ============================================
-- CORREÇÃO DEFINITIVA: Diferenciação de Tipos de Documentos
-- Adiciona campo doc_type para separar Contrato Principal de Dossiês
-- LIMPA documentos inválidos que não têm file_path
-- ============================================

-- 1. Adicionar coluna doc_type na tabela process_documents
-- Valores possíveis: 'dossie_comprador', 'dossie_vendedor'
-- (O contrato principal fica em processes.contract_url, não aqui)
ALTER TABLE process_documents 
ADD COLUMN IF NOT EXISTS doc_type TEXT CHECK (doc_type IN ('dossie_comprador', 'dossie_vendedor'));

-- 2. Criar índice para performance nas queries
CREATE INDEX IF NOT EXISTS idx_process_documents_doc_type ON process_documents(doc_type);

-- 3. LIMPAR documentos inválidos (sem file_path no JSONB documents)
-- Estes são documentos que foram criados incorretamente ou estão incompletos
DELETE FROM process_documents
WHERE (documents->>'file_path') IS NULL 
   OR (documents->>'file_path') = ''
   OR documents IS NULL
   OR documents = '{}'::jsonb;

-- 4. Atualizar documentos existentes válidos para ter doc_type baseado em person_type
UPDATE process_documents
SET doc_type = CASE 
  WHEN person_type = 'comprador' THEN 'dossie_comprador'
  WHEN person_type = 'vendedor' THEN 'dossie_vendedor'
  ELSE NULL
END
WHERE doc_type IS NULL 
  AND person_type IN ('comprador', 'vendedor')
  AND (documents->>'file_path') IS NOT NULL
  AND (documents->>'file_path') != '';

-- 5. Garantir que todos os documentos válidos tenham doc_type
UPDATE process_documents
SET doc_type = 'dossie_comprador'
WHERE doc_type IS NULL 
  AND person_type = 'comprador'
  AND (documents->>'file_path') IS NOT NULL;

UPDATE process_documents
SET doc_type = 'dossie_vendedor'
WHERE doc_type IS NULL 
  AND person_type = 'vendedor'
  AND (documents->>'file_path') IS NOT NULL;

-- 6. Remover documentos que ainda não têm doc_type após a limpeza
-- (Estes são documentos inválidos que não puderam ser categorizados)
DELETE FROM process_documents
WHERE doc_type IS NULL;

-- 7. Verificação final
SELECT 
  '✅ Correção aplicada' as status,
  COUNT(*) FILTER (WHERE doc_type = 'dossie_comprador') as dossies_comprador,
  COUNT(*) FILTER (WHERE doc_type = 'dossie_vendedor') as dossies_vendedor,
  COUNT(*) FILTER (WHERE doc_type IS NULL) as sem_tipo,
  COUNT(*) as total_documentos_validos
FROM process_documents;

-- 8. Mostrar resumo por processo
SELECT 
  p.id as process_id,
  p.client_name,
  COUNT(pd.id) FILTER (WHERE pd.doc_type = 'dossie_comprador') as docs_comprador,
  COUNT(pd.id) FILTER (WHERE pd.doc_type = 'dossie_vendedor') as docs_vendedor,
  COUNT(pd.id) as total_docs
FROM processes p
LEFT JOIN process_documents pd ON pd.process_id = p.id
GROUP BY p.id, p.client_name
ORDER BY p.created_at DESC
LIMIT 10;
