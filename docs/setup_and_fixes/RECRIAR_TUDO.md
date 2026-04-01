# 🔄 Guia Completo para Recriar o Banco de Dados

Este guia vai te ajudar a recriar todo o banco de dados e configurações após o projeto Supabase ter sido reiniciado.

## ⚠️ Situação Atual

O projeto está em **"SETTING UP PROJECT"**, o que significa que:
- O banco de dados foi reiniciado/zerado
- Todas as tabelas, políticas e dados foram perdidos
- É necessário recriar tudo do zero

---

## 📋 Passo a Passo Completo

### ✅ Passo 1: Aguardar o Provisionamento

1. Acesse: https://app.supabase.com
2. Selecione o projeto **PosVendaDonna**
3. **AGUARDE** até aparecer "Project ready" ou similar
4. Isso pode levar alguns minutos

---

### ✅ Passo 2: Obter Variáveis de Ambiente

1. No Supabase Dashboard, clique em **Settings** (⚙️)
2. Clique em **API**
3. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Atualize na Vercel:**
   - Vá em: https://vercel.com → Seu projeto → Settings → Environment Variables
   - Atualize as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Faça um novo deploy após atualizar

---

### ✅ Passo 3: Executar Schema do Banco de Dados

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New query**
3. Abra o arquivo `RECRIAR_BANCO_COMPLETO.sql` do projeto
4. Copie **TODO** o conteúdo
5. Cole no SQL Editor
6. Clique em **Run**
7. Você deve ver: "✅ Schema do banco de dados criado com sucesso!"

**Este script cria:**
- ✅ Tabela `profiles` (usuários)
- ✅ Tabela `processes` (processos de venda)
- ✅ Tabela `process_documents` (documentos)
- ✅ Todas as políticas RLS
- ✅ Funções e triggers automáticos

---

### ✅ Passo 4: Criar Buckets de Storage

#### Bucket 1: `contracts`

1. No Supabase Dashboard, vá em **Storage**
2. Clique em **New bucket**
3. Configure:
   - **Name:** `contracts`
   - **Public bucket:** ❌ **DESMARCADO** (privado)
4. Clique em **Create bucket**

#### Bucket 2: `documents`

1. Ainda em **Storage**
2. Clique em **New bucket**
3. Configure:
   - **Name:** `documents`
   - **Public bucket:** ❌ **DESMARCADO** (privado)
4. Clique em **Create bucket**

---

### ✅ Passo 5: Configurar Políticas do Storage

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New query**
3. Abra o arquivo `RECRIAR_STORAGE_COMPLETO.sql`
4. Copie **TODO** o conteúdo
5. Cole no SQL Editor
6. Clique em **Run**
7. Você deve ver: "✅ Políticas de Storage criadas com sucesso!"

**Este script cria políticas para:**
- ✅ Bucket `contracts` (contratos)
- ✅ Bucket `documents` (documentos de comprador/vendedor)

---

### ✅ Passo 6: Criar Usuário Admin

1. No Supabase Dashboard, vá em **Authentication** → **Users**
2. Clique em **Add user** → **Create new user**
3. Preencha:
   - **Email:** `admin@donna.com`
   - **Password:** (defina uma senha forte, ex: `Admin@2024!`)
   - **Auto Confirm User:** ✅ **MARCADO** (importante!)
4. Clique em **Create user**

---

### ✅ Passo 7: Configurar Role do Admin

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New query**
3. Abra o arquivo `RECRIAR_ADMIN.sql`
4. Copie **TODO** o conteúdo
5. Cole no SQL Editor
6. Clique em **Run**
7. Você deve ver os dados do usuário admin criado

---

### ✅ Passo 8: Verificar se Está Tudo OK

Execute este SQL no SQL Editor para verificar:

```sql
-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verificar usuário admin
SELECT 
  u.email,
  u.email_confirmed_at,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@donna.com';

-- Verificar buckets
SELECT name, public 
FROM storage.buckets;
```

**Deve retornar:**
- ✅ 3 tabelas: `profiles`, `processes`, `process_documents`
- ✅ Usuário `admin@donna.com` com `role = 'admin'`
- ✅ 2 buckets: `contracts` e `documents` (ambos privados)

---

### ✅ Passo 9: Testar o Login

1. Acesse: https://p-s-venda.vercel.app/login
2. Faça login com:
   - **Email:** `admin@donna.com`
   - **Senha:** (a senha que você definiu no Passo 6)
3. Você deve ser redirecionado para `/admin`

---

## 📝 Checklist Final

- [ ] Projeto Supabase provisionado e pronto
- [ ] Variáveis de ambiente atualizadas na Vercel
- [ ] Schema do banco executado (`RECRIAR_BANCO_COMPLETO.sql`)
- [ ] Bucket `contracts` criado (privado)
- [ ] Bucket `documents` criado (privado)
- [ ] Políticas de Storage executadas (`RECRIAR_STORAGE_COMPLETO.sql`)
- [ ] Usuário admin criado no Authentication
- [ ] Role do admin configurado (`RECRIAR_ADMIN.sql`)
- [ ] Login funcionando
- [ ] Deploy na Vercel atualizado

---

## 🆘 Problemas Comuns

### Erro "relation does not exist"
- **Solução:** Execute o `RECRIAR_BANCO_COMPLETO.sql` novamente

### Erro ao criar bucket
- **Solução:** Verifique se o bucket não existe já. Delete e crie novamente se necessário

### Erro "policy already exists"
- **Solução:** O script já tem `DROP POLICY IF EXISTS`, mas se persistir, delete manualmente as políticas antigas

### Login não funciona
- **Solução:** 
  1. Verifique se o email está confirmado no Supabase
  2. Execute o `RECRIAR_ADMIN.sql` novamente
  3. Limpe os cookies do navegador

### Variáveis de ambiente não funcionam
- **Solução:**
  1. Atualize as variáveis na Vercel
  2. Faça um novo deploy
  3. Aguarde alguns minutos para o deploy completar

---

## 📞 Próximos Passos

Após recriar tudo:
1. Teste criar um novo processo
2. Teste fazer upload de contrato
3. Teste adicionar documentos de comprador/vendedor
4. Crie uma conta de cliente para testar o fluxo completo

---

**✅ Pronto! Seu sistema está recriado e funcionando novamente!**
