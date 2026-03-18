-- ============================================
-- SCRIPT COMPLETO PARA RECRIAR O BANCO DE DADOS
-- Execute este script APÓS o projeto Supabase terminar de provisionar
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- TABELA: processes
-- ============================================
CREATE TABLE IF NOT EXISTS processes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  property_address TEXT,
  property_value DECIMAL(12, 2),
  contract_url TEXT,
  contract_filename TEXT,
  status_steps JSONB DEFAULT '{
    "upload": true,
    "engineering": false,
    "signature": false,
    "itbi": false,
    "registry": false,
    "delivery": false
  }'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed')) DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_processes_client_email ON processes(client_email);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);

-- ============================================
-- TABELA: process_documents
-- ============================================
CREATE TABLE IF NOT EXISTS process_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  person_type TEXT NOT NULL CHECK (person_type IN ('comprador', 'vendedor')),
  telefone TEXT,
  email TEXT,
  profissao TEXT,
  estado_civil TEXT NOT NULL CHECK (estado_civil IN ('solteiro', 'casado', 'divorciado', 'viuvo')),
  documents JSONB DEFAULT '{}'::jsonb,
  spouse_data JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_process_documents_process_id ON process_documents(process_id);
CREATE INDEX IF NOT EXISTS idx_process_documents_person_type ON process_documents(person_type);

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Função para criar perfil automaticamente
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_process_documents_updated_at ON process_documents;
CREATE TRIGGER update_process_documents_updated_at
  BEFORE UPDATE ON process_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_documents ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

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

DROP POLICY IF EXISTS "Clients can view their own processes" ON processes;
CREATE POLICY "Clients can view their own processes"
  ON processes FOR SELECT
  USING (
    client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policies para process_documents (usando função para evitar recursão)
DROP POLICY IF EXISTS "Admins can view all documents" ON process_documents;
CREATE POLICY "Admins can view all documents"
  ON process_documents FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can create documents" ON process_documents;
CREATE POLICY "Admins can create documents"
  ON process_documents FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update documents" ON process_documents;
CREATE POLICY "Admins can update documents"
  ON process_documents FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete documents" ON process_documents;
CREATE POLICY "Admins can delete documents"
  ON process_documents FOR DELETE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Clients can view their own documents" ON process_documents;
CREATE POLICY "Clients can view their own documents"
  ON process_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM processes p
      INNER JOIN profiles pr ON pr.email = p.client_email
      WHERE p.id = process_documents.process_id
        AND pr.id = auth.uid()
    )
  );

-- ============================================
-- MENSAGEM DE SUCESSO
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Schema do banco de dados criado com sucesso!';
  RAISE NOTICE '📋 Próximos passos:';
  RAISE NOTICE '   1. Criar bucket "contracts" no Storage';
  RAISE NOTICE '   2. Criar bucket "documents" no Storage';
  RAISE NOTICE '   3. Executar políticas de Storage';
  RAISE NOTICE '   4. Criar usuário admin';
END $$;
