# 🔓 Como Desabilitar Confirmação de Email no Supabase

## ⚠️ Problema Atual
Você está recebendo o erro **"Email not confirmed"** ao tentar fazer login.

Isso acontece porque o Supabase por padrão requer que os usuários confirmem o email antes de fazer login.

---

## ✅ Solução: Desabilitar Confirmação de Email

### Para Desenvolvimento/Teste (Recomendado)

1. **Acesse o Supabase Dashboard**
   - https://app.supabase.com
   - Selecione o projeto **PosVendaDonna**

2. **Vá em Authentication → Settings**
   - No menu lateral, clique em **Authentication**
   - Clique em **Settings** (ou vá direto em **Configuration → URL Configuration**)

3. **Desabilite "Enable email confirmations"**
   - Procure pela opção **"Enable email confirmations"**
   - **DESMARQUE** a checkbox
   - Clique em **Save**

4. **Teste Novamente**
   - Tente fazer login novamente
   - O erro deve desaparecer

---

## 🔄 Alternativa: Confirmar Email Manualmente

Se você quiser manter a confirmação de email ativada, pode confirmar manualmente:

1. **No Supabase Dashboard**
   - Vá em **Authentication → Users**
   - Encontre o usuário que você quer confirmar
   - Clique nos **3 pontos** (menu) ao lado do usuário
   - Selecione **"Send confirmation email"** ou **"Confirm user"**

2. **Ou via SQL Editor**
   ```sql
   -- Confirma um usuário específico
   UPDATE auth.users 
   SET email_confirmed_at = NOW() 
   WHERE email = 'mateus@gmail.com';
   ```

---

## 📧 Para Produção

Em produção, é recomendado manter a confirmação de email ativada por segurança. Nesse caso:

1. Configure o SMTP no Supabase (Settings → Auth → SMTP Settings)
2. Os usuários receberão emails de confirmação automaticamente
3. Adicione uma página de "Verificar email" no seu app

---

## ✅ Após Desabilitar

Depois de desabilitar a confirmação de email:

1. **Usuários existentes** precisam ser confirmados manualmente (veja alternativa acima)
2. **Novos usuários** serão confirmados automaticamente
3. **Login funcionará** imediatamente após criar a conta

---

## 🆘 Ainda com Problemas?

Se mesmo após desabilitar ainda der erro:

1. Verifique se salvou as configurações no Supabase
2. Confirme os usuários existentes manualmente (SQL acima)
3. Tente criar um novo usuário e fazer login
4. Limpe o cache do navegador

