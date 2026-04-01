-- =====================================================
-- CORREÇÃO DEFINITIVA: PERMISSÕES DA SECRETARIA E RLS DE PROCESSOS
-- =====================================================
-- 1. Atualiza todos os processos sem dono para pertencerem à(s) secretaria(s) ou admin
-- 2. Recria as políticas RLS para garantir que a secretaria possa visualizar, criar e editar
--    os processos que ela mesma criou.

BEGIN;

-- =====================================================
-- PASSO 1: Corrigir processos órfãos (user_id IS NULL)
-- =====================================================
DO $$
DECLARE
    fallback_user_id UUID;
BEGIN
    -- Tenta encontrar o ID da secretaria
    SELECT id INTO fallback_user_id 
    FROM profiles 
    WHERE role = 'secretaria' 
    LIMIT 1;
    
    -- Se não encontrar secretaria, usa um admin
    IF fallback_user_id IS NULL THEN
        SELECT id INTO fallback_user_id 
        FROM profiles 
        WHERE role = 'admin' 
        LIMIT 1;
    END IF;

    -- Se encontrou algum usuário válido, atualiza os processos órfãos
    IF fallback_user_id IS NOT NULL THEN
        UPDATE processes 
        SET user_id = fallback_user_id
        WHERE user_id IS NULL OR user_id::text = 'undefined';
        
        RAISE NOTICE 'Processos órfãos atualizados para o usuário: %', fallback_user_id;
    ELSE
        RAISE NOTICE 'Nenhum usuário secretaria ou admin encontrado para assumir processos órfãos.';
    END IF;
END $$;


-- =====================================================
-- PASSO 2: Garantir que a coluna user_id existe (Precaução)
-- =====================================================
ALTER TABLE processes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);


-- =====================================================
-- PASSO 3: Limpar políticas RLS antigas
-- =====================================================
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all processes" ON processes;
DROP POLICY IF EXISTS "Clients can view own processes" ON processes;
DROP POLICY IF EXISTS "Team can view all processes" ON processes;
DROP POLICY IF EXISTS "Authenticated users can insert processes" ON processes;
DROP POLICY IF EXISTS "Users can update own processes" ON processes;
DROP POLICY IF EXISTS "Users can delete own processes" ON processes;
DROP POLICY IF EXISTS "Admins can insert processes" ON processes;
DROP POLICY IF EXISTS "Users can insert processes" ON processes;
DROP POLICY IF EXISTS "Read-only roles can view all processes" ON processes;
DROP POLICY IF EXISTS "Team can insert processes" ON processes;
DROP POLICY IF EXISTS "Team can update own processes" ON processes;


-- =====================================================
-- PASSO 4: Criar Políticas RLS Corretas para PROCESSES
-- =====================================================

-- 4.1. Admins podem fazer tudo
CREATE POLICY "Admins can manage all processes"
  ON processes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4.2. Clientes veem apenas seus processos
CREATE POLICY "Clients can view own processes"
  ON processes FOR SELECT
  USING (
    client_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- 4.3. Equipe pode ver TODOS os processos
CREATE POLICY "Team can view all processes"
  ON processes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('secretaria', 'financeiro', 'administrativo', 'gestor')
    )
  );

-- 4.4. Usuários autenticados (Equipe e Admin) podem INSERIR processos
CREATE POLICY "Authenticated users can insert processes"
  ON processes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- 4.5. UPDATE: Apenas dono do processo ou admin podem editar
CREATE POLICY "Users can update own processes"
  ON processes FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4.6. DELETE: Apenas dono ou admin
CREATE POLICY "Users can delete own processes"
  ON processes FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

COMMIT;

-- FIM DA CORREÇÃO
