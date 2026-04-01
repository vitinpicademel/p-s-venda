# Correção de Bugs Críticos - Criação de Processo + Lógica de Documentos

## ✅ Problemas Resolvidos

### PROBLEMA 1: Erro de Overflow Numérico
**Erro:** `code: "22003", message: "numeric field overflow"` ao criar processo com valores altos (ex: R$ 90.909.090.909,90)

**Solução Implementada:**
1. ✅ Criado SQL `CORRIGIR_VALOR_OVERFLOW.sql` para alterar `property_value` de `DECIMAL(12,2)` para `NUMERIC(15,2)`
2. ✅ Corrigida conversão do valor em `app/admin/page.tsx` para garantir número limpo (sem formatação)
3. ✅ Adicionada validação para garantir que o valor é um número válido

### PROBLEMA 2: Conflito de Documentos (Contrato x Comprador x Vendedor)
**Erro:** Sistema confundia "Contrato Inicial" com documentos de Comprador/Vendedor

**Solução Implementada:**
1. ✅ Criado SQL `ATUALIZAR_DOC_TYPE_CONTRATO_INICIAL.sql` para incluir `'contrato_inicial'` como valor válido de `doc_type`
2. ✅ Modificado `handleSubmit` em `app/admin/page.tsx` para salvar contrato inicial em `process_documents` com `doc_type: 'contrato_inicial'`
3. ✅ Refatorado `fetchDocuments` em `components/ProcessDocumentsList.tsx` para buscar estritamente por `doc_type` e `person_type`
4. ✅ Garantido que `ProcessDocumentsForm` salve corretamente com `doc_type` baseado em `person_type`

## 📋 Arquivos Modificados

1. **app/admin/page.tsx**
   - Corrigida conversão do valor (linhas 524-533)
   - Adicionada lógica para salvar contrato inicial em `process_documents` (linhas 559-580)

2. **components/ProcessDocumentsList.tsx**
   - Refatorado `fetchDocuments` para busca estrita por `doc_type` e `person_type`
   - Atualizada lógica de filtragem para excluir `contrato_inicial`
   - Busca estrita: Comprador = `doc_type: 'dossie_comprador'` + `person_type: 'comprador'`
   - Busca estrita: Vendedor = `doc_type: 'dossie_vendedor'` + `person_type: 'vendedor'`

3. **components/ProcessDocumentsForm.tsx**
   - Garantido que sempre salva com `doc_type` correto baseado em `person_type`
   - Melhorado tratamento de erros

## 🗄️ Scripts SQL a Executar

### 1. Corrigir Overflow Numérico
Execute no Supabase SQL Editor:
```sql
-- Arquivo: CORRIGIR_VALOR_OVERFLOW.sql
ALTER TABLE processes 
ALTER COLUMN property_value TYPE NUMERIC(15,2);
```

### 2. Atualizar Schema para Contrato Inicial
Execute no Supabase SQL Editor:
```sql
-- Arquivo: ATUALIZAR_DOC_TYPE_CONTRATO_INICIAL.sql
-- Remove constraint antiga
ALTER TABLE process_documents 
DROP CONSTRAINT IF EXISTS process_documents_doc_type_check;

-- Adiciona nova constraint com 'contrato_inicial'
ALTER TABLE process_documents 
ADD CONSTRAINT process_documents_doc_type_check 
CHECK (doc_type IN ('contrato_inicial', 'dossie_comprador', 'dossie_vendedor'));
```

## 🔍 Como Funciona Agora

### Na Criação do Processo:
1. O PDF do contrato é salvo em `processes.contract_url` e `processes.contract_filename` (como antes)
2. **NOVO:** O contrato também é salvo em `process_documents` com:
   - `doc_type: 'contrato_inicial'`
   - `person_type: 'comprador'` (placeholder obrigatório, não usado)
   - `documents.file_path`: caminho do arquivo no storage

### No Dashboard (Componente de Detalhes):
- **Área do Comprador:** Busca APENAS documentos com `doc_type: 'dossie_comprador'` E `person_type: 'comprador'`
- **Área do Vendedor:** Busca APENAS documentos com `doc_type: 'dossie_vendedor'` E `person_type: 'vendedor'`
- **Contrato Inicial:** NÃO aparece nas áreas de Comprador/Vendedor (está separado)

### No Modal de Upload:
- Ao anexar documentos do comprador: salva como `doc_type: 'dossie_comprador'`
- Ao anexar documentos do vendedor: salva como `doc_type: 'dossie_vendedor'`

## ✅ Resultado Final

Agora é possível ter os 3 arquivos existindo simultaneamente sem conflitos:
1. ✅ **Contrato Inicial** (`doc_type: 'contrato_inicial'`) - salvo na criação do processo
2. ✅ **Dossiê Comprador** (`doc_type: 'dossie_comprador'` + `person_type: 'comprador'`) - upload separado
3. ✅ **Dossiê Vendedor** (`doc_type: 'dossie_vendedor'` + `person_type: 'vendedor'`) - upload separado

## 🚀 Próximos Passos

1. Execute os 2 scripts SQL no Supabase SQL Editor
2. Teste criar um processo com valor alto (ex: R$ 90.909.090.909,90)
3. Teste fazer upload de documentos de comprador e vendedor separadamente
4. Verifique que o contrato inicial não aparece nas áreas de Comprador/Vendedor

## 📝 Notas Importantes

- O campo `person_type` é obrigatório no schema, mas para `contrato_inicial` ele é apenas um placeholder
- O sistema agora faz busca estrita, então documentos antigos sem `doc_type` correto podem não aparecer
- Se houver documentos antigos sem `doc_type`, execute o SQL `CORRIGIR_TIPOS_DOCUMENTOS.sql` primeiro
