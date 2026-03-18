# 👤 Como Criar e Configurar o Login de Administrador

## 📋 Resumo

O sistema identifica administradores de **duas formas**:

1. **Por Email:** Se o email contém `admin` ou `donna` → redireciona para `/admin`
2. **Por Role no Banco:** Se o campo `role = 'admin'` na tabela `profiles` → tem acesso completo

**Recomendação:** Use AMBOS os métodos para garantir acesso.

---

## 🎯 Login Recomendado para Admin

### Opção 1: Email com "admin" (Mais Simples)
```
Email: admin@donna.com
Senha: [defina uma senha forte]
```

### Opção 2: Email com "donna" (Alternativa)
```
Email: dona@donnanegociacoes.com
Senha: [defina uma senha forte]
```

### Opção 3: Qualquer email (mas precisa configurar role)
```
Email: seu-email@qualquer.com
Senha: [defina uma senha forte]
+ Configurar role = 'admin' no banco
```

---

## 📝 Passo a Passo para Criar Admin

### Método 1: Criar via Supabase Dashboard (Recomendado)

1. **Acesse o Supabase Dashboard**
   - https://app.supabase.com
   - Selecione o projeto **PosVendaDonna**

2. **Criar Usuário**
   - Vá em **Authentication → Users**
   - Clique em **"Add user"** → **"Create new user"**
   - Preencha:
     - **Email:** `admin@donna.com` (ou outro com "admin" ou "donna")
     - **Password:** (defina uma senha forte, ex: `Admin@2024!`)
     - **Auto Confirm User:** ✅ **MARCADO** (importante!)
   - Clique em **"Create user"**

3. **Configurar Role como Admin**
   - Vá em **SQL Editor**
   - Execute o seguinte SQL:

```sql
-- Atualiza o role do usuário para admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@donna.com';
```

4. **Verificar se funcionou**
   - Execute este SQL para confirmar:

```sql
SELECT id, email, role, full_name 
FROM profiles 
WHERE email = 'admin@donna.com';
```

   - Deve retornar: `role = 'admin'`

---

### Método 2: Criar via Sign Up + Atualizar Role

1. **Criar conta via Sign Up**
   - Acesse: http://localhost:3000/signup
   - Preencha:
     - Nome: `Administrador`
     - Email: `admin@donna.com`
     - Senha: (defina uma senha forte)
   - Clique em **"Criar Conta"**

2. **Atualizar Role no Banco**
   - Supabase Dashboard → SQL Editor
   - Execute:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@donna.com';
```

---

## ✅ Credenciais Padrão Sugeridas

```
Email: admin@donna.com
Senha: Admin@2024!
```

**⚠️ IMPORTANTE:** Altere a senha após o primeiro login!

---

## 🔍 Como Verificar se Está Funcionando

1. **Faça Login**
   - Acesse: http://localhost:3000/login
   - Use: `admin@donna.com` + sua senha
   - Deve redirecionar para `/admin`

2. **Verifique no Console (F12)**
   - Deve aparecer: `"Tentando redirecionar para: /admin"`
   - Deve aparecer: `"Middleware Check: /admin Logado: admin@donna.com"`

3. **Verifique no Supabase**
   - Authentication → Users
   - O usuário deve aparecer com email confirmado
   - SQL Editor → Verificar se `role = 'admin'` na tabela `profiles`

---

## 🛠️ Script SQL Completo para Criar Admin

Execute este SQL no Supabase para criar e configurar tudo de uma vez:

```sql
-- 1. Verifica se o usuário existe
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'admin@donna.com';

-- 2. Se não existir, você precisa criar manualmente no Dashboard primeiro
-- Depois execute:

-- 3. Garante que o perfil existe e está como admin
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  'Administrador',
  'admin'
FROM auth.users u
WHERE u.email = 'admin@donna.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  full_name = 'Administrador';

-- 4. Confirma o email (se necessário)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'admin@donna.com' 
  AND email_confirmed_at IS NULL;

-- 5. Verifica o resultado
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@donna.com';
```

---

## 🔐 Criar Múltiplos Admins

Para criar mais administradores, repita o processo com outros emails:

```sql
-- Exemplo: criar admin2@donna.com como admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin2@donna.com';
```

Ou use emails que contenham "admin" ou "donna" no nome.

---

## 🆘 Troubleshooting

### Problema: Login não redireciona para /admin

**Solução:**
1. Verifique se o email contém "admin" ou "donna"
2. Verifique se `role = 'admin'` no banco:
   ```sql
   SELECT email, role FROM profiles WHERE email = 'admin@donna.com';
   ```
3. Verifique se o email está confirmado:
   ```sql
   SELECT email, email_confirmed_at FROM auth.users WHERE email = 'admin@donna.com';
   ```

### Problema: Erro "Email not confirmed"

**Solução:**
1. Desabilite confirmação de email (Authentication → Settings)
2. OU confirme manualmente:
   ```sql
   UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'admin@donna.com';
   ```

### Problema: Não consegue acessar /admin

**Solução:**
1. Verifique os logs do middleware no console
2. Execute o SQL para garantir que `role = 'admin'`
3. Limpe os cookies e tente novamente

---

## 📌 Resumo Final

**Login de Admin Padrão:**
- **Email:** `admin@donna.com`
- **Senha:** (defina no Supabase Dashboard)
- **Role:** `admin` (configurado via SQL)

**Após criar, faça login e você terá acesso completo ao painel administrativo!**

