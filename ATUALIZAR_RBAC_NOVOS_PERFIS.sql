-- ============================================
-- Expansão do Sistema RBAC - Novos Perfis Read-Only
-- Sistema de Acompanhamento Pós-Venda Imobiliário
-- ============================================

-- 1. Atualizar o tipo ENUM para incluir as novas roles
ALTER TYPE user_role ADD VALUE 'secretaria';
ALTER TYPE user_role ADD VALUE 'financeiro';  
ALTER TYPE user_role ADD VALUE 'administrativo';
ALTER TYPE user_role ADD VALUE 'gestor';

-- 2. Atualizar políticas RLS para tabela processes
-- Política para Admin (mantida)
DROP POLICY IF EXISTS "Admins can manage processes" ON processes;
CREATE POLICY "Admins can manage processes"
  ON processes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para Clientes (mantida)
DROP POLICY IF EXISTS "Clients can view own processes" ON processes;
CREATE POLICY "Clients can view own processes"
  ON processes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'client'
      AND client_email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- Políticas para os novos perfis Read-Only
DROP POLICY IF EXISTS "Read-only users can view all processes" ON processes;
CREATE POLICY "Read-only users can view all processes"
  ON processes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- 3. Atualizar políticas RLS para tabela process_steps
-- Política para Admin (mantida)
DROP POLICY IF EXISTS "Admins can manage process_steps" ON process_steps;
CREATE POLICY "Admins can manage process_steps"
  ON process_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para Clientes (mantida)
DROP POLICY IF EXISTS "Clients can view own process_steps" ON process_steps;
CREATE POLICY "Clients can view own process_steps"
  ON process_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM processes
      WHERE processes.id = process_steps.process_id
        AND processes.client_email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- Políticas para os novos perfis Read-Only
DROP POLICY IF EXISTS "Read-only users can view all process_steps" ON process_steps;
CREATE POLICY "Read-only users can view all process_steps"
  ON process_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- 4. Atualizar políticas RLS para tabela step_documents
-- Política para Admin (mantida)
DROP POLICY IF EXISTS "Admins can manage step documents" ON step_documents;
CREATE POLICY "Admins can manage step documents"
  ON step_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para Clientes (mantida)
DROP POLICY IF EXISTS "Clients can view own step documents" ON step_documents;
CREATE POLICY "Clients can view own step documents"
  ON step_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM processes
      WHERE processes.id = step_documents.process_id
        AND processes.client_email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- Políticas para os novos perfis Read-Only
DROP POLICY IF EXISTS "Read-only users can view all step_documents" ON step_documents;
CREATE POLICY "Read-only users can view all step_documents"
  ON step_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- 5. Atualizar políticas RLS para tabela process_logs (se existir)
-- Política para Admin (mantida)
CREATE POLICY IF NOT EXISTS "Admins can manage process_logs"
  ON process_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para os novos perfis Read-Only
CREATE POLICY IF NOT EXISTS "Read-only users can view all process_logs"
  ON process_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- 6. Atualizar Storage policies para os novos perfis
-- Política para Admin (mantida)
CREATE POLICY IF NOT EXISTS "Admins can upload contracts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'contracts' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para os novos perfis Read-Only (apenas visualização)
CREATE POLICY IF NOT EXISTS "Read-only users can view contracts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracts' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );
