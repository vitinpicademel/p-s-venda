-- =====================================================
-- ATUALIZAR RLS - VERSÃO SEGURA E SIMPLES
-- =====================================================
-- Execute este script se o anterior deu erro

-- =====================================================
-- PASSO 1: Habilitar RLS nas tabelas (se não estiver)
-- =====================================================
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASSO 2: Remover políticas antigas (com segurança)
-- =====================================================
DO $$
BEGIN
    -- Remover políticas da tabela processes
    DROP POLICY IF EXISTS "Users can view own processes" ON processes;
    DROP POLICY IF EXISTS "Admins can manage all processes" ON processes;
    DROP POLICY IF EXISTS "Users can insert processes" ON processes;
    DROP POLICY IF EXISTS "Users can update own processes" ON processes;
    DROP POLICY IF EXISTS "Read-only roles can view all processes" ON processes;
    
    -- Remover políticas da tabela step_documents
    DROP POLICY IF EXISTS "Admins can manage step_documents" ON step_documents;
    DROP POLICY IF EXISTS "Users can view own step_documents" ON step_documents;
    DROP POLICY IF EXISTS "Read-only roles can view all step_documents" ON step_documents;
    
    -- Remover políticas da tabela process_logs
    DROP POLICY IF EXISTS "Admins can manage process_logs" ON process_logs;
    DROP POLICY IF EXISTS "Users can view own process_logs" ON process_logs;
    DROP POLICY IF EXISTS "Read-only roles can view all process_logs" ON process_logs;
END $$;

-- =====================================================
-- PASSO 3: Criar políticas para PROCESSES
-- =====================================================

-- Admins podem fazer tudo
CREATE POLICY "Admins can manage all processes"
  ON processes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Clientes veem apenas seus processos
CREATE POLICY "Clients can view own processes"
  ON processes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'client'
      AND profiles.id = processes.client_id
    )
  );

-- Roles de leitura (secretaria, financeiro, etc) veem TUDO
CREATE POLICY "Read-only roles can view all processes"
  ON processes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- Admins podem inserir
CREATE POLICY "Admins can insert processes"
  ON processes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PASSO 4: Criar políticas para STEP_DOCUMENTS
-- =====================================================

-- Admins podem fazer tudo
CREATE POLICY "Admins can manage step_documents"
  ON step_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Clientes veem documentos dos próprios processos
CREATE POLICY "Clients can view own step_documents"
  ON step_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM processes p
      WHERE p.id = step_documents.process_id 
      AND p.client_id = auth.uid()
    )
  );

-- Roles de leitura veem TODOS os documentos
CREATE POLICY "Read-only roles can view all step_documents"
  ON step_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- =====================================================
-- PASSO 5: Criar políticas para PROCESS_LOGS
-- =====================================================

-- Admins podem fazer tudo
CREATE POLICY "Admins can manage process_logs"
  ON process_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Clientes veem logs dos próprios processos
CREATE POLICY "Clients can view own process_logs"
  ON process_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM processes p
      WHERE p.id = process_logs.process_id 
      AND p.client_id = auth.uid()
    )
  );

-- Roles de leitura veem TODOS os logs
CREATE POLICY "Read-only roles can view all process_logs"
  ON process_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- Todos podem criar logs
CREATE POLICY "All users can create process_logs"
  ON process_logs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- =====================================================
-- PASSO 6: Verificação simples
-- =====================================================

-- Verificar políticas criadas
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('processes', 'step_documents', 'process_logs')
ORDER BY tablename, policyname;

-- =====================================================
-- TESTE RÁPIDO
-- =====================================================

-- Testar se secretaria pode ver processos
DO $$
DECLARE
    secretaria_count INTEGER;
BEGIN
    -- Contar processos usando a política de secretaria
    SELECT COUNT(*) INTO secretaria_count
    FROM processes 
    WHERE EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    );
    
    RAISE NOTICE 'Teste: Secretaria pode ver % processos', secretaria_count;
END $$;

-- =====================================================
-- RESUMO
-- =====================================================

/*
POLÍTICAS CRIADAS:

✅ processes:
   - Admins: ALL (controle total)
   - Clients: SELECT (apenas próprios)
   - Read-only roles: SELECT (todos os processos)
   - Admins: INSERT (apenas admins)

✅ step_documents:
   - Admins: ALL (controle total)
   - Clients: SELECT (apenas próprios)
   - Read-only roles: SELECT (todos os documentos)

✅ process_logs:
   - Admins: ALL (controle total)
   - Clients: SELECT (apenas próprios)
   - Read-only roles: SELECT (todos os logs)
   - All users: INSERT (criar logs)

ROLES COM ACESSO TOTAL DE LEITURA:
🔹 secretaria - Vê tudo
🔹 financeiro - Vê tudo
🔹 administrativo - Vê tudo
🔹 gestor - Vê tudo

Após executar:
1. Teste login com secretaria
2. Dashboard deve aparecer com todos os processos
3. Modal deve abrir com detalhes
*/
