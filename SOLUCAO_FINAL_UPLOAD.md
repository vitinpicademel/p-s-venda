# 🔥 SOLUÇÃO FINAL PARA ERRO DE UPLOAD

## ⚠️ Problema
Erro persistente: `StorageApiError: new row violates row-level security policy`

## ✅ SOLUÇÃO DEFINITIVA (Execute nesta ordem)

### 1. Execute o SQL DIRETO (SEM função is_admin())
```sql
-- Arquivo: SOLUCAO_DIRETA_STORAGE.sql
```
**Este script cria políticas que verificam diretamente se você é admin, sem usar função.**

### 2. Verifique se funcionou
O script vai mostrar:
- ✅ Se você está logado como admin
- ✅ Quantas políticas foram criadas (deve ser 5)

### 3. Limpe TUDO no navegador
1. **Pressione `F12`** para abrir DevTools
2. Vá na aba **"Application"**
3. No menu esquerdo, clique em **"Storage"**
4. Clique em **"Clear site data"**
5. Marque **TODAS** as opções
6. Clique em **"Clear site data"**
7. **Feche TODAS as abas** do sistema
8. **Feche o navegador completamente**

### 4. Abra novamente e faça login
1. Abra o navegador novamente
2. Vá para o sistema
3. **Faça login como `admin@donna.com`**
4. Abra o **Console do navegador** (F12 > Console)
5. Tente fazer upload

### 5. Veja os logs no console
Agora o código mostra logs detalhados:
- ✅ Se você está autenticado
- ✅ Se você é admin
- ✅ Se o upload foi bem-sucedido
- ❌ Onde exatamente está falhando

## 🔍 Se AINDA Não Funcionar

### Opção A: Verificar no Supabase Dashboard
1. Vá em **Storage > process-docs**
2. Tente fazer upload **manualmente** de um arquivo
3. Se funcionar manualmente = problema no código
4. Se não funcionar = problema nas políticas

### Opção B: Verificar políticas ativas
Execute no SQL Editor:
```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%process-docs%';
```

Deve mostrar 5 políticas.

### Opção C: Verificar se você é admin
Execute no SQL Editor:
```sql
SELECT 
  auth.uid() as user_id,
  p.email,
  p.role,
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) as is_admin_check
FROM profiles p
WHERE p.id = auth.uid();
```

Deve retornar `is_admin_check = true`.

## 📝 Arquivos Criados

1. **`SOLUCAO_DIRETA_STORAGE.sql`** ⭐ **EXECUTE ESTE PRIMEIRO**
   - Cria políticas sem função is_admin()
   - Verificação direta na política

2. **`SOLUCAO_FORCADA_STORAGE.sql`** (alternativa)
   - Política super permissiva
   - Use se a solução direta não funcionar

3. **`ProcessDocumentsForm.tsx`** (atualizado)
   - Adiciona logs detalhados
   - Verifica autenticação antes do upload
   - Mostra exatamente onde está falhando

## 🎯 Próximos Passos

1. ✅ Execute `SOLUCAO_DIRETA_STORAGE.sql`
2. ✅ Limpe cache completamente
3. ✅ Faça logout/login
4. ✅ Tente upload
5. ✅ Veja os logs no console
6. ✅ Me diga o que aparece nos logs
