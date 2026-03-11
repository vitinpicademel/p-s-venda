# 🚀 Como Configurar Variáveis de Ambiente na Vercel

## ⚠️ Erro 500: MIDDLEWARE_INVOCATION_FAILED

Este erro geralmente acontece quando as variáveis de ambiente do Supabase **não estão configuradas** na Vercel.

---

## ✅ Solução: Configurar Variáveis de Ambiente

### Passo 1: Obter as Credenciais do Supabase

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (chave longa que começa com `eyJ...`)

### Passo 2: Configurar na Vercel

1. Acesse: https://vercel.com
2. Vá no seu projeto
3. Clique em **Settings** (no menu superior)
4. Clique em **Environment Variables** (no menu lateral)
5. Adicione as seguintes variáveis:

#### Para Production, Preview e Development:

**Variável 1:**
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** Cole a **Project URL** do Supabase
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

**Variável 2:**
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** Cole a **anon public** key do Supabase
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

6. Clique em **Save** para cada variável

### Passo 3: Fazer Redeploy

Após adicionar as variáveis:

1. Vá em **Deployments** (no menu superior)
2. Clique nos **3 pontos** (⋯) do deployment mais recente
3. Clique em **Redeploy**
4. Aguarde o deploy completar

**OU**

1. Faça um novo commit (mesmo que vazio):
   ```bash
   git commit --allow-empty -m "trigger redeploy"
   git push
   ```

---

## 🔍 Verificar se Está Configurado

Após o redeploy, acesse seu site na Vercel. Se ainda der erro:

1. Verifique se as variáveis foram salvas corretamente
2. Verifique se o redeploy foi concluído
3. Verifique os logs do deployment na Vercel

---

## 📋 Checklist

- [ ] Variáveis obtidas do Supabase Dashboard
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada na Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada na Vercel
- [ ] Variáveis marcadas para Production, Preview e Development
- [ ] Redeploy feito após configurar variáveis
- [ ] Site funcionando sem erro 500

---

## 🆘 Ainda com Problemas?

Se ainda der erro após configurar as variáveis:

1. **Verifique os logs do deployment:**
   - Vercel Dashboard → Deployments → Clique no deployment → Logs

2. **Verifique se as variáveis estão corretas:**
   - Não devem ter espaços extras
   - Não devem ter aspas
   - Devem ser os valores exatos do Supabase

3. **Limpe o cache:**
   - Vercel Dashboard → Settings → General → Clear Build Cache

4. **Verifique se o middleware foi atualizado:**
   - O middleware agora tem tratamento de erro
   - Se as variáveis não estiverem configuradas, ele permite acesso sem quebrar

---

## 📝 Nota Importante

O middleware foi atualizado para **não quebrar** mesmo se as variáveis não estiverem configuradas. Ele apenas permite acesso sem autenticação. Mas para funcionar corretamente, **você DEVE configurar as variáveis na Vercel**.

