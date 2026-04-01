-- ============================================
-- CORREÇÃO: Remover acesso direto a auth.users
-- O erro "permission denied for table users" vem de políticas que acessam auth.users
-- ============================================

-- 1. Remover políticas que usam auth.users diretamente
DROP POLICY IF EXISTS "Clients can view own processes" ON processes;
DROP POLICY IF EXISTS "Clients can view their own processes" ON processes;
DROP POLICY IF EXISTS "Clients can view own documents" ON process_documents;
DROP POLICY IF EXISTS "Clients can view their own documents" ON process_documents;

-- 2. Recriar políticas usando profiles ao invés de auth.users

-- Processes: clientes podem ver seus próprios processos
CREATE POLICY "Clients can view own processes"
  ON processes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.email = processes.client_email
    )
  );

-- Process_documents: clientes podem ver documentos de seus processos
CREATE POLICY "Clients can view own documents"
  ON process_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM processes p
      INNER JOIN profiles pr ON pr.email = p.client_email
      WHERE p.id = process_documents.process_id
        AND pr.id = auth.uid()
    )
  );

-- 3. Verificar se há outras políticas usando auth.users
SELECT 
  schemaname,
  tablename,
  policyname,
  qual::text as policy_condition
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual::text LIKE '%auth.users%' OR with_check::text LIKE '%auth.users%');

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas corrigidas! Removido acesso direto a auth.users';
  RAISE NOTICE '⚠️ Faça logout e login novamente';
END $$;
