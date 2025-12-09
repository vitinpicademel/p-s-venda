# 🚀 Guia de Configuração Completo

## Passo 1: Configurar Variáveis de Ambiente

1. Abra o arquivo `.env.local` na raiz do projeto
2. Substitua os valores placeholder pelos valores reais do seu projeto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_real_aqui
```

**Onde encontrar esses valores:**
- Acesse: https://app.supabase.com
- Selecione seu projeto (ou crie um novo)
- Vá em **Settings** → **API**
- Copie:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Passo 2: Configurar Banco de Dados

1. No Supabase Dashboard, vá em **SQL Editor**
2. Abra o arquivo `supabase-schema-v2.sql` do projeto
3. Copie todo o conteúdo e cole no SQL Editor
4. Clique em **Run** para executar

Isso vai criar:
- Tabela `profiles` (usuários)
- Tabela `processes` (processos de venda)
- Políticas de segurança (RLS)
- Funções e triggers automáticos

## Passo 3: Configurar Storage (Bucket de Contratos)

1. No Supabase Dashboard, vá em **Storage**
2. Clique em **New bucket**
3. Nome: `contracts`
4. Marque como **Private** (não público)
5. Clique em **Create bucket**

## Passo 4: Criar Primeiro Usuário Admin

1. No Supabase Dashboard, vá em **Authentication** → **Users**
2. Clique em **Add user** → **Create new user**
3. Preencha:
   - Email: `admin@donna.com` (ou o email que você quiser)
   - Password: (defina uma senha)
   - Auto Confirm User: ✅ (marcado)
4. Clique em **Create user**

5. Depois, vá em **SQL Editor** e execute:

```sql
-- Atualiza o role do usuário para admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@donna.com';
```

## Passo 5: Reiniciar o Servidor

1. Pare o servidor atual (Ctrl+C no terminal)
2. Execute novamente:
```bash
npm run dev
```

## ✅ Testar

1. Acesse: http://localhost:3000
2. Faça login com o email admin criado
3. Você deve ser redirecionado para `/admin`
4. Teste criar um novo processo
5. Teste fazer signup com um email de cliente
6. Teste fazer login como cliente e ver o processo

## 🔧 Troubleshooting

**Erro "Failed to fetch":**
- Verifique se as variáveis no `.env.local` estão corretas
- Certifique-se de ter reiniciado o servidor após criar/editar `.env.local`
- Verifique se não há espaços extras nas variáveis

**Erro "Missing Supabase environment variables":**
- O arquivo `.env.local` existe?
- As variáveis começam com `NEXT_PUBLIC_`?
- Você reiniciou o servidor?

**Erro ao criar conta:**
- Verifique se o SQL foi executado corretamente
- Verifique se a tabela `profiles` existe no Supabase

