# 🔧 Resolver Erro de Upload: "new row violates row-level security policy"

## ⚠️ Erro Persistente
Mesmo após criar as políticas, o erro continua. Isso geralmente significa:
1. **Você não está logado como admin** (mais comum)
2. **Sessão não foi atualizada** após criar as políticas
3. **Cache do navegador** está usando credenciais antigas

## ✅ Solução Passo a Passo

### Passo 1: Verificar se você é Admin
Execute no **Supabase SQL Editor**:

```sql
-- Arquivo: VERIFICAR_STORAGE_POLICIES.sql
```

Isso vai mostrar:
- Se você está logado como admin
- Se a função `is_admin()` está funcionando
- Quais políticas existem

### Passo 2: Se NÃO for Admin, Corrigir
Execute no **Supabase SQL Editor**:

```sql
-- Arquivo: VERIFICAR_ADMIN.sql
```

Isso vai garantir que o usuário `admin@donna.com` está configurado como admin.

### Passo 3: Recriar Políticas (Forçar)
Execute no **Supabase SQL Editor**:

```sql
-- Arquivo: CORRIGIR_STORAGE_DEFINITIVO.sql
```

Este script:
- Remove todas as políticas antigas
- Recria a função `is_admin()` corretamente
- Cria todas as políticas novamente
- Mostra se você está logado como admin

### Passo 4: Limpar Sessão e Cache

1. **No navegador:**
   - Pressione `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac) para limpar cache
   - OU vá em DevTools > Application > Clear Storage > Clear site data

2. **No sistema:**
   - Faça **logout completo**
   - Feche todas as abas do sistema
   - Abra uma nova aba
   - Faça **login novamente** como `admin@donna.com`

### Passo 5: Testar Upload

1. Vá em um processo
2. Clique em "Adicionar Documentos"
3. Selecione um PDF
4. Clique em "Salvar Documentos"
5. Deve funcionar! ✅

## 🔍 Diagnóstico Rápido

Execute este SQL para ver tudo de uma vez:

```sql
-- Verificar usuário atual
SELECT 
  auth.uid() as user_id,
  p.email,
  p.role,
  public.is_admin() as is_admin_result
FROM profiles p
WHERE p.id = auth.uid();

-- Verificar políticas
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%process-docs%';
```

## ❌ Se Ainda Não Funcionar

1. **Verifique o email de login:**
   - Você está logado com `admin@donna.com`?
   - Ou está usando outro email?

2. **Verifique o console do navegador:**
   - Abra DevTools (F12)
   - Vá na aba "Console"
   - Tente fazer upload
   - Veja se há outros erros além do RLS

3. **Teste direto no Supabase:**
   - Vá em Storage > process-docs
   - Tente fazer upload manual de um arquivo
   - Se funcionar manualmente, o problema é no código
   - Se não funcionar, o problema é nas políticas

## 📝 Nota Importante

O erro "new row violates row-level security policy" significa que:
- As políticas estão funcionando (bloqueando acesso não autorizado)
- Mas você não está sendo reconhecido como admin

A solução é garantir que:
1. ✅ Você está logado como `admin@donna.com`
2. ✅ O perfil tem `role = 'admin'`
3. ✅ A função `is_admin()` retorna `true` para você
4. ✅ As políticas estão usando `public.is_admin()` corretamente
