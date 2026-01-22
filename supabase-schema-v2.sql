-- ============================================
-- Sistema de Acompanhamento Pós-Venda Imobiliário
-- Schema do Banco de Dados Supabase - Versão 2 (Auth Real)
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
-- Vínculo por email (client_email)
-- ============================================
CREATE TABLE IF NOT EXISTS processes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_email TEXT NOT NULL, -- ELo de ligação: email do cliente
  client_name TEXT NOT NULL,
  property_address TEXT,
  property_value DECIMAL(12, 2),
  observations TEXT,
  contract_url TEXT, -- URL do PDF do contrato no Supabase Storage
  contract_filename TEXT,
  status_steps JSONB DEFAULT '{
    "upload": true,
    "engineering": false,
    "signature": false,
    "itbi": false,
    "registry": false,
    "delivery": false
  }'::jsonb, -- Status das etapas em JSON
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed')) DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_processes_client_email ON processes(client_email);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);

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
-- RLS (Row Level Security) Policies
-- ============================================

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
-- Usuários podem criar seu próprio perfil
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Usuários podem ver seu próprio perfil
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins podem ver todos os perfis
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies para processes
-- Admin pode ver e editar TODOS os processos
DROP POLICY IF EXISTS "Admins can view all processes" ON processes;
CREATE POLICY "Admins can view all processes"
  ON processes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can create processes" ON processes;
CREATE POLICY "Admins can create processes"
  ON processes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update processes" ON processes;
CREATE POLICY "Admins can update processes"
  ON processes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Cliente pode ver APENAS processos onde client_email = email do usuário logado
DROP POLICY IF EXISTS "Clients can view their own processes" ON processes;
CREATE POLICY "Clients can view their own processes"
  ON processes FOR SELECT
  USING (
    client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ============================================
-- FUNÇÃO: Verificar se email é admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin_email(email_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Define emails de admin (ajuste conforme necessário)
  RETURN email_to_check IN ('admin@donna.com', 'admin@donnanegociacoes.com');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

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
--         AND processes.client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
--     )
--   );
