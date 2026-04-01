# 🔧 Solução para Erro de Storage: "new row violates row-level security policy"

## ❌ Erro Identificado
```
StorageApiError: new row violates row-level security policy
```

## 🔍 Causa
O bucket `process-docs` **não tem políticas de storage configuradas** no Supabase. Sem essas políticas, o sistema não permite upload de arquivos, mesmo para usuários admin.

## ✅ Solução em 3 Passos

### Passo 1: Criar o Bucket (se não existir)
1. No **Supabase Dashboard**, vá em **Storage**
2. Clique em **"New bucket"**
3. Configure:
   - **Name:** `process-docs`
   - **Public bucket:** ❌ **DESMARCADO** (deve ser **privado**)
4. Clique em **"Create bucket"**

### Passo 2: Executar SQL de Políticas
1. No **Supabase Dashboard**, vá em **SQL Editor**
2. Abra o arquivo: **`CRIAR_POLITICAS_PROCESS_DOCS.sql`**
3. Copie **TODO** o conteúdo
4. Cole no SQL Editor
5. Clique em **"Run"**

Este script vai criar:
- ✅ Política para Admin fazer upload
- ✅ Política para Admin visualizar
- ✅ Política para Admin atualizar
- ✅ Política para Admin deletar
- ✅ Política para Cliente visualizar seus próprios documentos

### Passo 3: Verificar
1. Faça logout e login novamente (para atualizar a sessão)
2. Tente fazer upload de um documento novamente
3. Deve funcionar! ✅

## 📋 Arquivos Criados

- **`CRIAR_POLITICAS_PROCESS_DOCS.sql`** - Script SQL completo para criar as políticas
- **`RECRIAR_STORAGE_COMPLETO.sql`** - Atualizado para incluir `process-docs`

## 🔍 Se Ainda Não Funcionar

1. **Verifique se está logado como admin:**
   ```sql
   SELECT email, role FROM profiles WHERE id = auth.uid();
   ```
   Deve retornar `role = 'admin'`

2. **Verifique se o bucket existe:**
   - Vá em Storage no Supabase Dashboard
   - Confirme que `process-docs` está listado

3. **Verifique as políticas criadas:**
   ```sql
   SELECT policyname, cmd 
   FROM pg_policies 
   WHERE schemaname = 'storage' 
     AND tablename = 'objects'
     AND policyname LIKE '%process-docs%';
   ```
   Deve retornar 5 políticas

4. **Limpe o cache do navegador** e tente novamente

## 📝 Nota Importante

O bucket `process-docs` é diferente do bucket `documents`:
- **`documents`** - Bucket antigo (não usado mais)
- **`process-docs`** - Bucket atual usado para documentos de comprador/vendedor

Certifique-se de que as políticas estão configuradas para **`process-docs`** (com hífen).
