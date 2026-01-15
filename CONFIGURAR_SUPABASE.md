# 🔧 Configuração Completa do Supabase - Passo a Passo

## ✅ Passo 1: Obter Variáveis de Ambiente

1. No Supabase Dashboard, clique no ícone de **Settings** (⚙️) no menu lateral
2. Clique em **API** no menu de configurações
3. Você verá duas informações importantes:
   - **Project URL** (exemplo: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (uma chave longa que começa com `eyJ...`)

4. Copie esses valores e cole no arquivo `.env.local` do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE:** Substitua pelos valores REAIS do seu projeto!

---

## ✅ Passo 2: Executar o SQL Schema

1. No Supabase Dashboard, clique em **SQL Editor** (ícone de código `</>`)
2. Clique em **New query**
3. Abra o arquivo `supabase-schema-v2.sql` do projeto no VS Code
4. Copie **TODO** o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Você deve ver uma mensagem de sucesso: "Success. No rows returned"

Isso vai criar:
- ✅ Tabela `profiles` (usuários)
- ✅ Tabela `processes` (processos de venda)
- ✅ Políticas de segurança (RLS)
- ✅ Funções e triggers automáticos

---

## ✅ Passo 3: Criar Bucket de Storage

1. No Supabase Dashboard, clique em **Storage** (ícone de bucket 📦)
2. Clique em **New bucket**
3. Configure:
   - **Name:** `contracts`
   - **Public bucket:** ❌ **DESMARCADO** (deve ser privado)
4. Clique em **Create bucket**

### Configurar Políticas do Storage:

1. Com o bucket `contracts` criado, clique nele
2. Vá na aba **Policies**
3. Clique em **New policy** → **For full customization**
4. Cole o seguinte SQL:

```sql
-- Política para Admin fazer upload
CREATE POLICY "Admins can upload contracts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contracts' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para Admin visualizar todos os contratos
CREATE POLICY "Admins can view all contracts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contracts' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para Cliente visualizar seus próprios contratos
CREATE POLICY "Clients can view their own contracts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contracts' AND
  EXISTS (
    SELECT 1 FROM processes
    WHERE processes.contract_url LIKE '%' || storage.objects.name || '%'
      AND processes.client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);
```

5. Clique em **Review** e depois **Save policy**

---

## ✅ Passo 4: Criar Primeiro Usuário Admin

1. No Supabase Dashboard, clique em **Authentication** (ícone de usuário 👤)
2. Clique em **Users** no menu
3. Clique em **Add user** → **Create new user**
4. Preencha:
   - **Email:** `admin@donna.com` (ou o email que você quiser)
   - **Password:** (defina uma senha forte)
   - **Auto Confirm User:** ✅ **MARCADO** (importante!)
5. Clique em **Create user**

### Tornar o usuário Admin:

1. No Supabase Dashboard, vá em **SQL Editor**
2. Cole e execute:

```sql
-- Atualiza o role do usuário para admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@donna.com';
```

3. Clique em **Run**
4. Você deve ver: "Success. 1 row affected"

---

## ✅ Passo 5: Reiniciar o Servidor

1. No terminal do VS Code, pare o servidor (Ctrl+C)
2. Execute novamente:

```bash
npm run dev
```

---

## ✅ Passo 6: Testar

1. Acesse: http://localhost:3000
2. Você será redirecionado para `/login`
3. Faça login com:
   - Email: `admin@donna.com` (ou o email que você criou)
   - Senha: (a senha que você definiu)
4. Você deve ser redirecionado para `/admin`
5. Teste criar um novo processo
6. Teste fazer signup com um email de cliente
7. Teste fazer login como cliente e ver o processo

---

## 🔍 Verificar se está tudo OK

### Checklist:

- [ ] `.env.local` configurado com valores reais
- [ ] SQL schema executado com sucesso
- [ ] Bucket `contracts` criado (privado)
- [ ] Políticas do Storage configuradas
- [ ] Usuário admin criado e role atualizado
- [ ] Servidor reiniciado
- [ ] Login funcionando
- [ ] Admin dashboard acessível
- [ ] Criação de processo funcionando

---

## 🆘 Problemas Comuns

### Erro "Failed to fetch"
- Verifique se as variáveis no `.env.local` estão corretas
- Certifique-se de ter reiniciado o servidor após editar `.env.local`
- Verifique se não há espaços extras nas variáveis

### Erro "Missing Supabase environment variables"
- O arquivo `.env.local` existe na raiz do projeto?
- As variáveis começam com `NEXT_PUBLIC_`?
- Você reiniciou o servidor?

### Erro ao criar conta
- Verifique se o SQL foi executado corretamente
- Verifique se a tabela `profiles` existe no Supabase (Table Editor)

### Erro ao fazer upload de contrato
- Verifique se o bucket `contracts` foi criado
- Verifique se as políticas do Storage foram configuradas
- Verifique se o usuário tem role 'admin'

---

## 📞 Próximos Passos

Após configurar tudo:
1. Crie alguns processos de teste no Admin
2. Crie contas de clientes via Sign Up
3. Teste o fluxo completo
4. Quando estiver tudo funcionando, faça o deploy na Vercel

