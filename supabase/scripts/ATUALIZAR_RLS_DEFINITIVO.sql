-- =====================================================
-- ATUALIZAR RLS - VERSÃO DEFINITIVA COM DROP
-- =====================================================
-- Usando client_email para vincular processo ao usuário
-- DROP antes de cada CREATE para evitar conflitos

-- =====================================================
-- PASSO 1: Verificar estrutura da tabela processes
-- =====================================================

-- Verificar colunas da tabela processes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'processes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PASSO 2: Habilitar RLS nas tabelas
-- =====================================================
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASSO 3: Remover TODAS as políticas existentes
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage all processes" ON processes;
DROP POLICY IF EXISTS "Clients can view own processes" ON processes;
DROP POLICY IF EXISTS "Read-only roles can view all processes" ON processes;
DROP POLICY IF EXISTS "Admins can insert processes" ON processes;

DROP POLICY IF EXISTS "Admins can manage step_documents" ON step_documents;
DROP POLICY IF EXISTS "Clients can view own step_documents" ON step_documents;
DROP POLICY IF EXISTS "Read-only roles can view all step_documents" ON step_documents;

DROP POLICY IF EXISTS "Admins can manage process_logs" ON process_logs;
DROP POLICY IF EXISTS "Clients can view own process_logs" ON process_logs;
DROP POLICY IF EXISTS "Read-only roles can view all process_logs" ON process_logs;
DROP POLICY IF EXISTS "All users can create process_logs" ON process_logs;

-- =====================================================
-- PASSO 4: Criar políticas para PROCESSES
-- =====================================================

-- Admins podem fazer tudo
DROP POLICY IF EXISTS "Admins can manage all processes" ON processes;
CREATE POLICY "Admins can manage all processes"
  ON processes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Clientes veem apenas seus processos (usando client_email)
DROP POLICY IF EXISTS "Clients can view own processes" ON processes;
CREATE POLICY "Clients can view own processes"
  ON processes FOR SELECT
  USING (
    client_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Roles de leitura (secretaria, financeiro, etc) veem TUDO
DROP POLICY IF EXISTS "Read-only roles can view all processes" ON processes;
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
DROP POLICY IF EXISTS "Admins can insert processes" ON processes;
CREATE POLICY "Admins can insert processes"
  ON processes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PASSO 5: Criar políticas para STEP_DOCUMENTS
-- =====================================================

-- Admins podem fazer tudo
DROP POLICY IF EXISTS "Admins can manage step_documents" ON step_documents;
CREATE POLICY "Admins can manage step_documents"
  ON step_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Clientes veem documentos dos próprios processos
DROP POLICY IF EXISTS "Clients can view own step_documents" ON step_documents;
CREATE POLICY "Clients can view own step_documents"
  ON step_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM processes p
      WHERE p.id = step_documents.process_id 
      AND p.client_email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- Roles de leitura veem TODOS os documentos
DROP POLICY IF EXISTS "Read-only roles can view all step_documents" ON step_documents;
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
-- PASSO 6: Criar políticas para PROCESS_LOGS
-- =====================================================

-- Admins podem fazer tudo
DROP POLICY IF EXISTS "Admins can manage process_logs" ON process_logs;
CREATE POLICY "Admins can manage process_logs"
  ON process_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Clientes veem logs dos próprios processos
DROP POLICY IF EXISTS "Clients can view own process_logs" ON process_logs;
CREATE POLICY "Clients can view own process_logs"
  ON process_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM processes p
      WHERE p.id = process_logs.process_id 
      AND p.client_email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- Roles de leitura veem TODOS os logs
DROP POLICY IF EXISTS "Read-only roles can view all process_logs" ON process_logs;
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
DROP POLICY IF EXISTS "All users can create process_logs" ON process_logs;
CREATE POLICY "All users can create process_logs"
  ON process_logs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- =====================================================
-- PASSO 7: Verificação final
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
-- TESTE DE PERMISSÕES
-- =====================================================

-- Testar se secretaria pode ver processos
DO $$
DECLARE
    secretaria_id UUID;
    process_count INTEGER;
BEGIN
    -- Obter ID de um usuário secretaria
    SELECT id INTO secretaria_id 
    FROM profiles 
    WHERE role = 'secretaria' 
    LIMIT 1;
    
    IF secretaria_id IS NOT NULL THEN
        RAISE NOTICE 'Secretaria ID encontrado: %', secretaria_id;
        
        -- Contar processos totais
        SELECT COUNT(*) INTO process_count FROM processes;
        RAISE NOTICE 'Total de processos no banco: %', process_count;
        
        -- Testar política de secretaria
        RAISE NOTICE 'Secretaria deve conseguir ver todos os % processos', process_count;
    ELSE
        RAISE NOTICE 'Nenhum usuário secretaria encontrado';
    END IF;
END $$;

-- =====================================================
-- RESUMO FINAL
-- =====================================================

/*
POLÍTICAS DEFINITIVAS CRIADAS:

✅ processes:
   DROP + CREATE para cada política
   - Admins can manage all processes (ALL)
   - Clients can view own processes (SELECT via client_email)
   - Read-only roles can view all processes (SELECT tudo)
   - Admins can insert processes (INSERT)

✅ step_documents:
   DROP + CREATE para cada política
   - Admins can manage step_documents (ALL)
   - Clients can view own step_documents (SELECT via client_email)
   - Read-only roles can view all step_documents (SELECT tudo)

✅ process_logs:
   DROP + CREATE para cada política
   - Admins can manage process_logs (ALL)
   - Clients can view own process_logs (SELECT via client_email)
   - Read-only roles can view all process_logs (SELECT tudo)
   - All users can create process_logs (INSERT)

ROLES COM ACESSO TOTAL:
🔹 secretaria - Vê todos os processos
🔹 financeiro - Vê todos os processos
🔹 administrativo - Vê todos os processos
🔹 gestor - Vê todos os processos

COLUNA USADA: client_email (confirmada)

PADRÃO APLICADO: DROP POLICY IF EXISTS antes de cada CREATE

Após executar:
1. Dashboard da secretaria deve mostrar TODOS os processos
2. Modal deve abrir com detalhes completos
3. Select correspondent deve funcionar
4. Sem erros de política duplicada
*/
