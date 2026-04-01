# 🔑 Como Configurar o .env.local - Passo a Passo Visual

## ⚠️ PROBLEMA ATUAL
O arquivo `.env.local` ainda tem valores **placeholder** (exemplo):
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

Você precisa substituir pelos valores **REAIS** do seu projeto Supabase!

---

## 📋 PASSO A PASSO

### 1. Abra o Supabase Dashboard
- Acesse: https://app.supabase.com
- Faça login
- Selecione o projeto **PosVendaDonna**

### 2. Vá em Settings → API
- No menu lateral esquerdo, clique no ícone de **⚙️ Settings**
- Clique em **API** no submenu

### 3. Copie os Valores
Você verá duas seções importantes:

#### **Project URL**
```
https://xxxxxxxxxxxxx.supabase.co
```
- Copie essa URL completa (começa com `https://` e termina com `.supabase.co`)

#### **anon public** (chave)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg5ODc2NTQzLCJleHAiOjE5MDU0NTI1NDN9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- Copie essa chave completa (é uma string muito longa que começa com `eyJ...`)

### 4. Edite o arquivo `.env.local`
- No VS Code, abra o arquivo `.env.local` na raiz do projeto
- Substitua as linhas:

**ANTES (placeholder):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

**DEPOIS (valores reais):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg5ODc2NTQzLCJleHAiOjE5MDU0NTI1NDN9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ IMPORTANTE:**
- Não deixe espaços antes ou depois do `=`
- Não use aspas
- Copie os valores exatamente como aparecem no Supabase
- A URL deve começar com `https://`
- A chave é muito longa (mais de 200 caracteres)

### 5. Salve o arquivo
- Salve o arquivo (Ctrl+S ou Cmd+S)

### 6. REINICIE o servidor
**MUITO IMPORTANTE:** O Next.js só carrega variáveis de ambiente quando o servidor inicia!

1. No terminal, pressione **Ctrl+C** para parar o servidor
2. Execute novamente:
```bash
npm run dev
```

### 7. Teste
- Acesse: http://localhost:3000/signup
- O erro deve desaparecer
- Tente criar uma conta

---

## ✅ Como Saber se Está Correto

### ✅ CORRETO:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY4OTg3NjU0MywiZXhwIjoxOTA1NDUyNTQzfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### ❌ ERRADO (placeholder):
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

### ❌ ERRADO (com espaços):
```env
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
```

### ❌ ERRADO (com aspas):
```env
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

---

## 🆘 Ainda dando erro?

1. **Verifique se salvou o arquivo** (Ctrl+S)
2. **Verifique se reiniciou o servidor** (Ctrl+C e depois `npm run dev`)
3. **Verifique se não há espaços** antes ou depois do `=`
4. **Verifique se copiou os valores completos** (a chave é muito longa!)
5. **Verifique se o arquivo está na raiz do projeto** (mesmo nível que `package.json`)

---

## 📸 Onde encontrar no Supabase

```
Supabase Dashboard
  └── PosVendaDonna (seu projeto)
      └── ⚙️ Settings (menu lateral)
          └── API
              ├── Project URL: [copie aqui]
              └── anon public: [copie aqui]
```

