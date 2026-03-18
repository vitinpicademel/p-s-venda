-- =====================================================
-- RLS SIMPLIFICADO - CORREÇÃO DE ERROS
-- =====================================================

-- 1. Verificar se coluna user_id existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'processes' 
AND column_name = 'user_id';

-- 2. Habilitar RLS (se não estiver)
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;

-- 3. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Admins can manage all processes" ON processes;
DROP POLICY IF EXISTS "Clients can view own processes" ON processes;
DROP POLICY IF EXISTS "Team can view all processes" ON processes;
DROP POLICY IF EXISTS "Authenticated users can insert processes" ON processes;
DROP POLICY IF EXISTS "Users can update own processes" ON processes;
DROP POLICY IF EXISTS "Users can delete own processes" ON processes;

-- 4. Política para Admins (controle total)
CREATE POLICY "Admins can manage all processes"
  ON processes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Política para Clientes (ver apenas próprios)
CREATE POLICY "Clients can view own processes"
  ON processes FOR SELECT
  USING (
    client_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- 6. Política para Equipe (ver todos)
CREATE POLICY "Team can view all processes"
  ON processes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- 7. Política para INSERT (usuários autenticados)
CREATE POLICY "Authenticated users can insert processes"
  ON processes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- 8. Política para UPDATE (dono ou admin)
CREATE POLICY "Users can update own processes"
  ON processes FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 9. Política para DELETE (dono ou admin)
CREATE POLICY "Users can delete own processes"
  ON processes FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 10. Verificar políticas criadas
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'processes'
ORDER BY policyname;
