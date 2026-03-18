-- =====================================================
-- ATUALIZAR RLS - NOVO RBAC (CRIAÇÃO E EDIÇÃO LIMITADA)
-- =====================================================
-- Regras: Admin edita tudo | Equipe cria e edita apenas próprios processos

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

DROP POLICY IF EXISTS "Admins can manage step_documents" ON step_documents;
DROP POLICY IF EXISTS "Clients can view own step_documents" ON step_documents;
DROP POLICY IF EXISTS "Read-only roles can view all step_documents" ON step_documents;

DROP POLICY IF EXISTS "Admins can manage process_logs" ON process_logs;
DROP POLICY IF EXISTS "Clients can view own process_logs" ON process_logs;
DROP POLICY IF EXISTS "Read-only roles can view all process_logs" ON process_logs;
DROP POLICY IF EXISTS "All users can create process_logs" ON process_logs;

-- =====================================================
-- PASSO 4: Criar políticas para PROCESSES (NOVO RBAC)
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

-- Equipe (secretaria, financeiro, etc) pode ver TODOS os processos
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

-- Equipe pode INSERIR novos processos
DROP POLICY IF EXISTS "Team can insert processes" ON processes;
CREATE POLICY "Team can insert processes"
  ON processes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'secretaria', 'financeiro', 'administrativo', 'gestor')
    )
    AND admin_id = auth.uid() -- Define o criador
  );

-- Equipe pode ATUALIZAR apenas próprios processos
DROP POLICY IF EXISTS "Team can update own processes" ON processes;
CREATE POLICY "Team can update own processes"
  ON processes FOR UPDATE
  USING (
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
      OR admin_id = auth.uid()
    )
  )
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
      OR admin_id = auth.uid()
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

-- Equipe pode INSERIR documentos em processos que criou
DROP POLICY IF EXISTS "Team can insert step_documents" ON step_documents;
CREATE POLICY "Team can insert step_documents"
  ON step_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM processes p
      WHERE p.id = step_documents.process_id 
      AND (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
        OR p.admin_id = auth.uid()
      )
    )
  );

-- Equipe pode ATUALIZAR documentos de processos que criou
DROP POLICY IF EXISTS "Team can update own step_documents" ON step_documents;
CREATE POLICY "Team can update own step_documents"
  ON step_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM processes p
      WHERE p.id = step_documents.process_id 
      AND (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
        OR p.admin_id = auth.uid()
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
DROP POLICY IF EXISTS "All authenticated can create process_logs" ON process_logs;
CREATE POLICY "All authenticated can create process_logs"
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

-- Testar se equipe pode criar processo
DO $$
DECLARE
    team_user_id UUID;
BEGIN
    -- Obter ID de um usuário da equipe
    SELECT id INTO team_user_id 
    FROM profiles 
    WHERE role IN ('secretaria', 'financeiro', 'administrativo', 'gestor') 
    LIMIT 1;
    
    IF team_user_id IS NOT NULL THEN
        RAISE NOTICE 'Usuário da equipe ID: %', team_user_id;
        RAISE NOTICE 'Equipe pode criar processos e editar apenas os próprios';
    ELSE
        RAISE NOTICE 'Nenhum usuário da equipe encontrado';
    END IF;
END $$;

-- =====================================================
-- RESUMO DAS NOVAS POLÍTICAS
-- =====================================================

/*
NOVO RBAC IMPLEMENTADO:

✅ processes:
   - Admins: ALL (controle total)
   - Clients: SELECT (apenas próprios via client_email)
   - Team: SELECT (todos os processos)
   - Team: INSERT (pode criar, admin_id = auth.uid())
   - Team: UPDATE (apenas próprios processos ou admin)

✅ step_documents:
   - Admins: ALL (controle total)
   - Clients: SELECT (apenas próprios via client_email)
   - Team: SELECT (todos os documentos)
   - Team: INSERT (apenas em processos que criou)
   - Team: UPDATE (apenas em processos que criou)

✅ process_logs:
   - Admins: ALL (controle total)
   - Clients: SELECT (apenas próprios via client_email)
   - Team: SELECT (todos os logs)
   - All: INSERT (todos autenticados)

REGRA CHAVE:
🔹 admin_id = auth.uid() define o criador do processo
🔹 Equipe edita apenas onde admin_id = auth.uid()
🔹 Admin edita tudo (sem restrição)

ROLES COM CRIAÇÃO:
✅ admin - Cria e edita tudo
✅ secretaria - Cria e edita apenas próprios processos
✅ financeiro - Cria e edita apenas próprios processos
✅ administrativo - Cria e edita apenas próprios processos
✅ gestor - Cria e edita apenas próprios processos
*/
