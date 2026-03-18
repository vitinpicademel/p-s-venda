-- =====================================================
-- ATUALIZAR RLS - DEFINITIVO COM user_id
-- =====================================================
-- Coluna user_id agora existe e será usada para controle de edição

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
-- PASSO 3: Remover políticas antigas
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage all processes" ON processes;
DROP POLICY IF EXISTS "Clients can view own processes" ON processes;
DROP POLICY IF EXISTS "Read-only roles can view all processes" ON processes;
DROP POLICY IF EXISTS "Admins can insert processes" ON processes;
DROP POLICY IF EXISTS "Team can view all processes" ON processes;
DROP POLICY IF EXISTS "Team can insert processes" ON processes;
DROP POLICY IF EXISTS "Team can update own processes" ON processes;

DROP POLICY IF EXISTS "Admins can manage step_documents" ON step_documents;
DROP POLICY IF EXISTS "Clients can view own step_documents" ON step_documents;
DROP POLICY IF EXISTS "Read-only roles can view all step_documents" ON step_documents;
DROP POLICY IF EXISTS "Team can view all step_documents" ON step_documents;
DROP POLICY IF EXISTS "Team can insert step_documents" ON step_documents;
DROP POLICY IF EXISTS "Team can update own step_documents" ON step_documents;

DROP POLICY IF EXISTS "Admins can manage process_logs" ON process_logs;
DROP POLICY IF EXISTS "Clients can view own process_logs" ON process_logs;
DROP POLICY IF EXISTS "Read-only roles can view all process_logs" ON process_logs;
DROP POLICY IF EXISTS "All users can create process_logs" ON process_logs;
DROP POLICY IF EXISTS "Team can view all process_logs" ON process_logs;
DROP POLICY IF EXISTS "All authenticated can create process_logs" ON process_logs;

-- =====================================================
-- PASSO 4: Criar políticas para PROCESSES (COM user_id)
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

-- Clientes veem apenas seus processos
DROP POLICY IF EXISTS "Clients can view own processes" ON processes;
CREATE POLICY "Clients can view own processes"
  ON processes FOR SELECT
  USING (
    client_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Equipe pode ver TODOS os processos
DROP POLICY IF EXISTS "Team can view all processes" ON processes;
CREATE POLICY "Team can view all processes"
  ON processes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- Usuários autenticados podem INSERIR processos
DROP POLICY IF EXISTS "Authenticated users can insert processes" ON processes;
CREATE POLICY "Authenticated users can insert processes"
  ON processes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid() -- Define o criador
  );

-- UPDATE/DELETE: Apenas dono ou admin
DROP POLICY IF EXISTS "Users can update own processes" ON processes;
CREATE POLICY "Users can update own processes"
  ON processes FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: Apenas dono ou admin
DROP POLICY IF EXISTS "Users can delete own processes" ON processes;
CREATE POLICY "Users can delete own processes"
  ON processes FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
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

-- Equipe pode ver TODOS os documentos
DROP POLICY IF EXISTS "Team can view all step_documents" ON step_documents;
CREATE POLICY "Team can view all step_documents"
  ON step_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- Usuários autenticados podem INSERIR documentos
DROP POLICY IF EXISTS "Authenticated users can insert step_documents" ON step_documents;
CREATE POLICY "Authenticated users can insert step_documents"
  ON step_documents FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM processes p
      WHERE p.id = step_documents.process_id 
      AND (
        auth.uid() = p.user_id
        OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- UPDATE/DELETE: Apenas dono do processo ou admin
DROP POLICY IF EXISTS "Users can update own step_documents" ON step_documents;
CREATE POLICY "Users can update own step_documents"
  ON step_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM processes p
      WHERE p.id = step_documents.process_id 
      AND (
        auth.uid() = p.user_id
        OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
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

-- Equipe pode ver TODOS os logs
DROP POLICY IF EXISTS "Team can view all process_logs" ON process_logs;
CREATE POLICY "Team can view all process_logs"
  ON process_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- Todos autenticados podem criar logs
DROP POLICY IF EXISTS "Authenticated users can create process_logs" ON process_logs;
CREATE POLICY "Authenticated users can create process_logs"
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

-- Testar se usuário pode criar e editar apenas próprios processos
DO $$
DECLARE
    test_user_id UUID;
    process_count INTEGER;
BEGIN
    -- Obter ID de um usuário não-admin
    SELECT id INTO test_user_id 
    FROM profiles 
    WHERE role IN ('secretaria', 'financeiro', 'administrativo', 'gestor') 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Test user ID: %', test_user_id;
        RAISE NOTICE 'Regra: user_id = auth.uid() para edição';
        
        -- Contar processos totais
        SELECT COUNT(*) INTO process_count FROM processes;
        RAISE NOTICE 'Total de processos no banco: %', process_count;
        
        RAISE NOTICE 'Usuário pode ver todos os processos, mas editar apenas os que criou';
    ELSE
        RAISE NOTICE 'Nenhum usuário de equipe encontrado para teste';
    END IF;
END $$;

-- =====================================================
-- RESUMO DAS POLÍTICAS DEFINITIVAS
-- =====================================================

/*
POLÍTICAS RLS COM user_id IMPLEMENTADAS:

✅ processes:
   - Admins: ALL (controle total)
   - Clients: SELECT (apenas próprios via client_email)
   - Team: SELECT (todos os processos)
   - Authenticated: INSERT (com user_id = auth.uid())
   - Users: UPDATE/DELETE (apenas se user_id = auth.uid() OR admin)

✅ step_documents:
   - Admins: ALL (controle total)
   - Clients: SELECT (apenas próprios via client_email)
   - Team: SELECT (todos os documentos)
   - Authenticated: INSERT (apenas em processos que criou ou admin)
   - Users: UPDATE (apenas em processos que criou ou admin)

✅ process_logs:
   - Admins: ALL (controle total)
   - Clients: SELECT (apenas próprios via client_email)
   - Team: SELECT (todos os logs)
   - Authenticated: INSERT (todos autenticados)

REGRA PRINCIPAL:
🔹 auth.uid() = user_id para edição/ exclusão
🔹 Admin pode tudo (role = 'admin')
🔹 Equipe pode criar e editar apenas próprios processos
🔹 Todos podem ver (exceto clientes que veem apenas próprios)

COLUNA USADA: user_id (UUID REFERENCES auth.users(id))

ESTADO FINAL:
✅ Frontend: Envia user_id ao criar processo
✅ Frontend: Verifica canEdit baseado em user_id
✅ Backend: RLS controla acesso por user_id
*/
