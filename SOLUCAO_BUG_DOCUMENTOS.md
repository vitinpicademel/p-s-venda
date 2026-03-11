# 🔧 Solução para Bug de Documentos Duplicados

## Problema Identificado
O sistema estava contando o **Contrato Principal** como se fossem os documentos do **Comprador** e **Vendedor**, mostrando "1/1 documentos enviados" mesmo sem ter anexado nada nessas seções.

## Causa Raiz
1. **Falta de diferenciação**: Não havia campo `doc_type` para separar tipos de documentos
2. **Documentos inválidos**: Havia registros na tabela `process_documents` sem `file_path` válido
3. **Query sem filtro adequado**: A busca não estava filtrando corretamente por tipo

## Correções Implementadas

### 1. Código Frontend (`ProcessDocumentsList.tsx`)
- ✅ Query agora filtra apenas documentos com `file_path` válido
- ✅ Validação dupla: `person_type` + `doc_type` + `file_path`
- ✅ Fallback caso `doc_type` não exista ainda (SQL não executado)
- ✅ Melhor tratamento de erros na visualização de PDFs
- ✅ Mensagens de erro mais claras

### 2. Código Frontend (`ProcessDocumentsForm.tsx`)
- ✅ Salva `doc_type` automaticamente (`dossie_comprador` ou `dossie_vendedor`)
- ✅ Validação de `file_path` antes de salvar
- ✅ Fallback caso `doc_type` não exista na tabela

### 3. Banco de Dados (`CORRIGIR_TIPOS_DOCUMENTOS.sql`)
- ✅ Adiciona campo `doc_type` na tabela
- ✅ **LIMPA documentos inválidos** (sem `file_path`)
- ✅ Atualiza documentos existentes com `doc_type` correto
- ✅ Remove documentos que não podem ser categorizados

## ⚠️ AÇÃO NECESSÁRIA

### Passo 1: Executar SQL de Correção
Execute no **Supabase SQL Editor**:

```sql
-- Arquivo: CORRIGIR_TIPOS_DOCUMENTOS.sql
```

Este script irá:
- Adicionar campo `doc_type`
- **DELETAR documentos inválidos** (sem `file_path`)
- Atualizar documentos existentes

### Passo 2: (Opcional) Diagnosticar Problemas
Se ainda houver problemas, execute:

```sql
-- Arquivo: DIAGNOSTICAR_DOCUMENTOS.sql
```

Isso mostrará:
- Estado atual dos documentos
- Documentos problemáticos
- Processos com documentos duplicados

### Passo 3: Fazer Deploy
```bash
git add .
git commit -m "fix: corrige bug de documentos duplicados e melhora validação"
git push
```

## Como Funciona Agora

### 3 Tipos de Documentos Separados:

1. **Contrato Principal**
   - Salvo em: `processes.contract_url`
   - Aparece em: Seção "Upload do Contrato" (toggle)
   - **NÃO** aparece em "Documentos do Comprador/Vendedor"

2. **Dossiê Comprador**
   - Salvo em: `process_documents` com `doc_type = 'dossie_comprador'`
   - Aparece em: Seção "Documentos do Comprador"
   - Requer: `file_path` válido no JSONB `documents`

3. **Dossiê Vendedor**
   - Salvo em: `process_documents` com `doc_type = 'dossie_vendedor'`
   - Aparece em: Seção "Documentos do Vendedor"
   - Requer: `file_path` válido no JSONB `documents`

## Validações Implementadas

✅ **Query filtra por:**
- `process_id` correto
- `doc_type` válido (`dossie_comprador` ou `dossie_vendedor`)
- `file_path` existe no JSONB `documents`

✅ **Contagem só considera documentos com:**
- `person_type` correto
- `doc_type` correto
- `file_path` válido

✅ **Visualização de PDF:**
- Valida `bucket` e `file_path` antes de gerar URL
- Mensagens de erro claras
- Logs detalhados para debug

## Teste Após Correção

1. ✅ Criar processo novo
2. ✅ Anexar Contrato Principal
3. ✅ Verificar que Comprador e Vendedor aparecem como **"Pendente"**
4. ✅ Anexar documento do Comprador
5. ✅ Verificar que apenas Comprador aparece como **"Completo"**
6. ✅ Verificar que Vendedor continua **"Pendente"**
7. ✅ Clicar em "Ver PDF" e confirmar que abre corretamente
8. ✅ Repetir para Vendedor

## Se o Problema Persistir

1. Execute `DIAGNOSTICAR_DOCUMENTOS.sql` e compartilhe os resultados
2. Verifique no console do navegador se há erros
3. Confirme que o bucket `process-docs` existe no Supabase Storage
4. Verifique as policies do bucket `process-docs`
