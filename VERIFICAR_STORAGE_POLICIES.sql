-- ============================================
-- DIAGNÓSTICO: Verificar Políticas de Storage
-- Execute este SQL para diagnosticar o problema
-- ============================================

-- 1. Verificar se você está logado como admin
SELECT 
  'Status do Usuário' as tipo,
  auth.uid() as user_id,
  p.email,
  p.role,
  CASE 
    WHEN p.role = 'admin' THEN '✅ É ADMIN'
    ELSE '❌ NÃO É ADMIN'
  END as status
FROM profiles p
WHERE p.id = auth.uid();

-- 2. Verificar se a função is_admin() funciona
SELECT 
  'Função is_admin()' as tipo,
  public.is_admin() as resultado,
  CASE 
    WHEN public.is_admin() = true THEN '✅ FUNCIONA'
    ELSE '❌ NÃO FUNCIONA - Você não é admin'
  END as status;

-- 3. Listar TODAS as políticas do bucket process-docs
SELECT 
  policyname,
  cmd as operacao,
  qual as condicao_select,
  with_check as condicao_insert
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname LIKE '%process-docs%' OR policyname LIKE '%process_docs%')
ORDER BY cmd, policyname;

-- 4. Verificar se o bucket existe
SELECT 
  name as bucket_name,
  id as bucket_id,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'process-docs';

-- 5. Testar política de INSERT manualmente
-- Isso vai mostrar se a política está funcionando
SELECT 
  'Teste de Política INSERT' as tipo,
  public.is_admin() as is_admin_result,
  EXISTS(SELECT 1 FROM storage.buckets WHERE name = 'process-docs') as bucket_existe,
  CASE 
    WHEN public.is_admin() = true THEN '✅ DEVERIA PERMITIR UPLOAD (você é admin)'
    ELSE '❌ NÃO DEVERIA PERMITIR UPLOAD (você não é admin)'
  END as resultado;

-- 6. Verificar se há políticas conflitantes
SELECT 
  'Políticas Conflitantes' as tipo,
  COUNT(*) as total_policies_process_docs,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as policies_insert,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as policies_select,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as policies_delete
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname LIKE '%process-docs%' OR policyname LIKE '%process_docs%');
