-- ============================================
-- Sistema de Acompanhamento Pós-Venda Imobiliário
-- Schema do Banco de Dados Supabase
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: profiles
-- Armazena informações dos usuários (Admin e Cliente)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índice para busca por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- TABELA: processes
-- Armazena os processos de cada cliente
-- ============================================
CREATE TABLE IF NOT EXISTS processes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contract_url TEXT, -- URL do PDF do contrato no Supabase Storage
  contract_filename TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  property_address TEXT,
  property_value DECIMAL(12, 2),
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed')) DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_processes_client_id ON processes(client_id);
CREATE INDEX IF NOT EXISTS idx_processes_admin_id ON processes(admin_id);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);

-- ============================================
-- TABELA: process_steps
-- Armazena as etapas de cada processo
-- ============================================
CREATE TABLE IF NOT EXISTS process_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL, -- Ordem da etapa (1, 2, 3, ...)
  step_name TEXT NOT NULL,
  step_description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(process_id, step_order)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_process_steps_process_id ON process_steps(process_id);
CREATE INDEX IF NOT EXISTS idx_process_steps_status ON process_steps(status);
CREATE INDEX IF NOT EXISTS idx_process_steps_order ON process_steps(process_id, step_order);

-- ============================================
-- FUNÇÃO: Criar perfil automaticamente ao criar usuário
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNÇÃO: Criar etapas automaticamente ao criar processo
-- ============================================
CREATE OR REPLACE FUNCTION public.create_default_process_steps()
RETURNS TRIGGER AS $$
BEGIN
  -- Etapa 1: Upload do Contrato (já concluída)
  INSERT INTO public.process_steps (process_id, step_order, step_name, step_description, status, completed_at)
  VALUES (NEW.id, 1, 'Upload do Contrato', 'Contrato PDF enviado pela imobiliária', 'completed', NOW());

  -- Etapa 2: Engenharia do banco
  INSERT INTO public.process_steps (process_id, step_order, step_name, step_description, status)
  VALUES (NEW.id, 2, 'Engenharia do banco', 'Análise e aprovação do financiamento bancário', 'pending');

  -- Etapa 3: Assinatura do contrato bancário
  INSERT INTO public.process_steps (process_id, step_order, step_name, step_description, status)
  VALUES (NEW.id, 3, 'Assinatura do contrato bancário', 'Assinatura do contrato de financiamento', 'pending');

  -- Etapa 4: Recolhimento de ITBI
  INSERT INTO public.process_steps (process_id, step_order, step_name, step_description, status)
  VALUES (NEW.id, 4, 'Recolhimento de ITBI', 'Pagamento do Imposto sobre Transmissão de Bens Imóveis', 'pending');

  -- Etapa 5: Entrada cartório para registro
  INSERT INTO public.process_steps (process_id, step_order, step_name, step_description, status)
  VALUES (NEW.id, 5, 'Entrada cartório para registro', 'Registro da escritura no cartório', 'pending');

  -- Etapa 6: Processo Finalizado (só será concluída quando todas as outras estiverem prontas)
  INSERT INTO public.process_steps (process_id, step_order, step_name, step_description, status)
  VALUES (NEW.id, 6, 'Processo Finalizado', 'Entrega das chaves e conclusão do processo', 'pending');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar etapas automaticamente
DROP TRIGGER IF EXISTS on_process_created ON processes;
CREATE TRIGGER on_process_created
  AFTER INSERT ON processes
  FOR EACH ROW EXECUTE FUNCTION public.create_default_process_steps();

-- ============================================
-- FUNÇÃO: Atualizar status do processo quando todas as etapas estiverem concluídas
-- ============================================
CREATE OR REPLACE FUNCTION public.update_process_status()
RETURNS TRIGGER AS $$
DECLARE
  total_steps INTEGER;
  completed_steps INTEGER;
BEGIN
  -- Conta total de etapas (exceto a última "Processo Finalizado")
  SELECT COUNT(*) INTO total_steps
  FROM public.process_steps
  WHERE process_id = NEW.process_id AND step_order < 6;

  -- Conta etapas concluídas (exceto a última)
  SELECT COUNT(*) INTO completed_steps
  FROM public.process_steps
  WHERE process_id = NEW.process_id 
    AND step_order < 6 
    AND status = 'completed';

  -- Se todas as etapas (exceto a última) estiverem concluídas, marca a última como concluída
  IF completed_steps = total_steps THEN
    UPDATE public.process_steps
    SET status = 'completed', 
        completed_at = NOW(),
        updated_at = NOW()
    WHERE process_id = NEW.process_id AND step_order = 6;

    -- Atualiza status do processo
    UPDATE public.processes
    SET status = 'completed', updated_at = NOW()
    WHERE id = NEW.process_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar status do processo
DROP TRIGGER IF EXISTS on_process_step_updated ON process_steps;
CREATE TRIGGER on_process_step_updated
  AFTER UPDATE OF status ON process_steps
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status = 'pending')
  EXECUTE FUNCTION public.update_process_status();

-- ============================================
-- RLS (Row Level Security) Policies
-- ============================================

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_steps ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies para processes
CREATE POLICY "Clients can view their own processes"
  ON processes FOR SELECT
  USING (
    auth.uid() = client_id OR 
    auth.uid() = admin_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create processes"
  ON processes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update processes"
  ON processes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies para process_steps
CREATE POLICY "Users can view steps of their processes"
  ON process_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM processes
      WHERE processes.id = process_steps.process_id
        AND (processes.client_id = auth.uid() 
             OR processes.admin_id = auth.uid()
             OR EXISTS (
               SELECT 1 FROM profiles 
               WHERE id = auth.uid() AND role = 'admin'
             ))
    )
  );

CREATE POLICY "Admins can update process steps"
  ON process_steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Storage Bucket para contratos
-- ============================================
-- Nota: Execute isso no Supabase Dashboard > Storage
-- CREATE BUCKET IF NOT EXISTS 'contracts' WITH PUBLIC = false;
-- 
-- CREATE POLICY "Admins can upload contracts"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'contracts' AND
--     EXISTS (
--       SELECT 1 FROM profiles 
--       WHERE id = auth.uid() AND role = 'admin'
--     )
--   );
--
-- CREATE POLICY "Users can view their own contracts"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'contracts' AND
--     EXISTS (
--       SELECT 1 FROM processes
--       WHERE processes.contract_url LIKE '%' || storage.objects.name || '%'
--         AND (processes.client_id = auth.uid() OR processes.admin_id = auth.uid())
--     )
--   );

