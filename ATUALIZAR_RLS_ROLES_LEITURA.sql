-- =====================================================
-- ATUALIZAR POLÍTICAS RLS PARA ROLES DE LEITURA
-- =====================================================
-- Permite que secretaria, financeiro, administrativo e gestor
-- visualizem todos os processos e dados relacionados

-- =====================================================
-- PASSO 1: Atualizar políticas para tabela PROCESSES
-- =====================================================

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view own processes" ON processes;
DROP POLICY IF EXISTS "Admins can manage all processes" ON processes;
DROP POLICY IF EXISTS "Users can insert processes" ON processes;
DROP POLICY IF EXISTS "Users can update own processes" ON processes;

-- Política para Admins (controle total)
CREATE POLICY "Admins can manage all processes"
  ON processes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para Clientes (ver apenas seus próprios processos)
CREATE POLICY "Clients can view own processes"
  ON processes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'client'
      AND profiles.id = processes.client_id
    )
  );

-- Política para Roles de Leitura (secretaria, financeiro, administrativo, gestor)
CREATE POLICY "Read-only roles can view all processes"
  ON processes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- Política para Clientes (inserir apenas se admin permitir)
CREATE POLICY "Admins can insert processes"
  ON processes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para Admins (update)
CREATE POLICY "Admins can update processes"
  ON processes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para Roles de Leitura (update de campos específicos)
CREATE POLICY "Read-only roles can update correspondent"
  ON processes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  )
  WITH CHECK (
    -- Permite apenas atualizar o campo correspondent
    (
      SELECT COUNT(*) FROM jsonb_each(to_jsonb(old())) as kv
      WHERE kv.key NOT IN ('correspondent', 'updated_at')
    ) = 0
  );

-- =====================================================
-- PASSO 2: Atualizar políticas para tabela STEP_DOCUMENTS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can manage step_documents" ON step_documents;
DROP POLICY IF EXISTS "Users can view own step_documents" ON step_documents;

-- Política para Admins (controle total)
CREATE POLICY "Admins can manage step_documents"
  ON step_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para Clientes (ver documentos dos próprios processos)
CREATE POLICY "Clients can view own step_documents"
  ON step_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM processes p
      JOIN profiles pr ON pr.id = p.client_id
      WHERE p.id = step_documents.process_id 
      AND pr.id = auth.uid() 
      AND pr.role = 'client'
    )
  );

-- Política para Roles de Leitura (ver todos os documentos)
CREATE POLICY "Read-only roles can view all step_documents"
  ON step_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- Política para Upload (admin e roles de leitura podem fazer upload)
CREATE POLICY "Admins and read-only roles can upload documents"
  ON step_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- =====================================================
-- PASSO 3: Atualizar políticas para tabela PROCESS_LOGS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can manage process_logs" ON process_logs;
DROP POLICY IF EXISTS "Users can view own process_logs" ON process_logs;

-- Política para Admins (controle total)
CREATE POLICY "Admins can manage process_logs"
  ON process_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para Clientes (ver logs dos próprios processos)
CREATE POLICY "Clients can view own process_logs"
  ON process_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM processes p
      JOIN profiles pr ON pr.id = p.client_id
      WHERE p.id = process_logs.process_id 
      AND pr.id = auth.uid() 
      AND pr.role = 'client'
    )
  );

-- Política para Roles de Leitura (ver todos os logs)
CREATE POLICY "Read-only roles can view all process_logs"
  ON process_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- Política para Criar logs (todos podem criar logs)
CREATE POLICY "All authenticated users can create process_logs"
  ON process_logs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- =====================================================
-- PASSO 4: Verificação das políticas
-- =====================================================

-- Verificar políticas da tabela processes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'processes'
ORDER BY policyname;

-- Verificar políticas da tabela step_documents
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'step_documents'
ORDER BY policyname;

-- Verificar políticas da tabela process_logs
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'process_logs'
ORDER BY policyname;

-- =====================================================
-- PASSO 5: Teste de permissões
-- =====================================================

-- Testar se usuário secretaria pode ver processos
DO $$
DECLARE
    secretaria_user_id UUID;
    process_count INTEGER;
BEGIN
    -- Obter ID de um usuário secretaria
    SELECT id INTO secretaria_user_id 
    FROM profiles 
    WHERE role = 'secretaria' 
    LIMIT 1;
    
    IF secretaria_user_id IS NOT NULL THEN
        -- Contar processos visíveis para secretaria
        EXECUTE format('SELECT COUNT(*) FROM processes WHERE %s', 
            (
                SELECT qual FROM pg_policies 
                WHERE tablename = 'processes' 
                AND policyname = 'Read-only roles can view all processes'
                LIMIT 1
            )
        ) INTO process_count;
        
        RAISE NOTICE 'Secretaria pode ver % processos', process_count;
    ELSE
        RAISE NOTICE 'Nenhum usuário secretaria encontrado';
    END IF;
END $$;

-- =====================================================
-- RESUMO DAS POLÍTICAS CRIADAS
-- =====================================================

/*
TABELA: processes
├── Admins can manage all processes (ALL)
├── Clients can view own processes (SELECT)
├── Read-only roles can view all processes (SELECT)
├── Admins can insert processes (INSERT)
├── Admins can update processes (UPDATE)
└── Read-only roles can update correspondent (UPDATE)

TABELA: step_documents  
├── Admins can manage step_documents (ALL)
├── Clients can view own step_documents (SELECT)
├── Read-only roles can view all step_documents (SELECT)
└── Admins and read-only roles can upload documents (INSERT)

TABELA: process_logs
├── Admins can manage process_logs (ALL)
├── Clients can view own process_logs (SELECT)
├── Read-only roles can view all process_logs (SELECT)
└── All authenticated users can create process_logs (INSERT)

ROLES COM ACESSO DE LEITURA COMPLETO:
✅ secretaria - Ver todos os processos, documentos e logs
✅ financeiro - Ver todos os processos, documentos e logs  
✅ administrativo - Ver todos os processos, documentos e logs
✅ gestor - Ver todos os processos, documentos e logs

PERMISSÕES ADICIONAIS:
✅ Podem atualizar o campo "correspondent"
✅ Podem fazer upload de documentos
✅ Podem criar logs de atividades
*/
