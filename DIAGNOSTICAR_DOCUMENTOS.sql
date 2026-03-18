-- ============================================
-- DIAGNÓSTICO: Verificar estado dos documentos
-- Execute este script para entender o problema
-- ============================================

-- 1. Verificar se a coluna doc_type existe
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'process_documents'
  AND column_name = 'doc_type';

-- 2. Contar documentos por tipo
SELECT 
  COALESCE(doc_type, 'SEM TIPO') as tipo_documento,
  person_type,
  COUNT(*) as quantidade,
  COUNT(*) FILTER (WHERE (documents->>'file_path') IS NOT NULL AND (documents->>'file_path') != '') as com_file_path,
  COUNT(*) FILTER (WHERE (documents->>'file_path') IS NULL OR (documents->>'file_path') = '') as sem_file_path
FROM process_documents
GROUP BY doc_type, person_type
ORDER BY doc_type, person_type;

-- 3. Listar documentos problemáticos (sem file_path)
SELECT 
  id,
  process_id,
  person_type,
  doc_type,
  (documents->>'file_path') as file_path,
  (documents->>'bucket') as bucket,
  created_at
FROM process_documents
WHERE (documents->>'file_path') IS NULL 
   OR (documents->>'file_path') = ''
   OR documents IS NULL
   OR documents = '{}'::jsonb
ORDER BY created_at DESC;

-- 4. Listar documentos válidos por processo
SELECT 
  p.id as process_id,
  p.client_name,
  p.contract_filename as contrato_principal,
  pd.id as doc_id,
  pd.person_type,
  pd.doc_type,
  (pd.documents->>'file_path') as file_path,
  (pd.documents->>'bucket') as bucket,
  pd.created_at
FROM processes p
LEFT JOIN process_documents pd ON pd.process_id = p.id
ORDER BY p.created_at DESC, pd.created_at DESC
LIMIT 20;

-- 5. Verificar processos com documentos duplicados ou incorretos
SELECT 
  p.id as process_id,
  p.client_name,
  COUNT(pd.id) FILTER (WHERE pd.person_type = 'comprador') as docs_comprador,
  COUNT(pd.id) FILTER (WHERE pd.person_type = 'vendedor') as docs_vendedor,
  COUNT(pd.id) FILTER (WHERE (pd.documents->>'file_path') IS NULL) as docs_sem_path,
  COUNT(pd.id) as total_docs
FROM processes p
LEFT JOIN process_documents pd ON pd.process_id = p.id
GROUP BY p.id, p.client_name
HAVING COUNT(pd.id) > 0
ORDER BY total_docs DESC;
