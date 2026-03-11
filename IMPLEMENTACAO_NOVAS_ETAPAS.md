# Implementação do Novo Fluxo de Etapas - Sistema Pós-Venda

## 📋 Resumo das Alterações

Foram implementadas 4 novas etapas no início do processo, alterando o fluxo de 8 para 9 etapas totais.

### 🔄 Novo Fluxo de Etapas

1. **Ficha de contrato e Planilha de Cálculo** (nova - com upload de 2 arquivos)
2. **Emissão do contrato** (nova)
3. **Validação do jurídico** (nova)
4. **Assinaturas do contrato** (nova)
5. **Solicitação Engenharia** (antiga "Engenharia do banco")
6. **Assinatura do contrato bancário** (antiga)
7. **Recolhimento de ITBI** (antiga)
8. **Entrada cartório para registro** (antiga)
9. **Entrega de Chaves** (antiga "Processo Finalizado")

## 🗄️ Arquivos Alterados

### 1. Banco de Dados
- **`ATUALIZAR_ETAPAS_NOVAS.sql`** - Script SQL completo para atualização do schema
  - Nova função `create_default_process_steps()` com 9 etapas
  - Nova tabela `step_documents` para arquivos da etapa 1
  - Colunas adicionais na tabela `processes` para arquivos
  - Políticas RLS atualizadas

### 2. TypeScript Types
- **`types/database.ts`** - Novo tipo `StepDocument` para documentos das etapas

### 3. Frontend Components
- **`components/Step1Upload.tsx`** - Componente especializado para upload de 2 arquivos
  - Upload de "Ficha de contrato" (PDF)
  - Upload de "Planilha de Cálculo" (Excel/CSV)
  - Validação automática: etapa só concluída com ambos os arquivos
  - Interface com drag & drop
  - Download dos arquivos enviados

### 4. Página Admin
- **`app/admin/page.tsx`** - Atualizada para novo fluxo
  - Novo `stepsConfig` com 9 etapas
  - Lógica de compatibilidade com dados antigos
  - Integração do componente `Step1Upload`
  - Kanban com 9 colunas
  - Progresso atualizado para 9 etapas

## 🚀 Passos para Implementação

### 1. Executar Script SQL
```sql
-- Execute no Supabase Dashboard > SQL Editor
-- Arquivo: ATUALIZAR_ETAPAS_NOVAS.sql
```

### 2. Configurar Storage (se necessário)
```sql
-- No Supabase Dashboard > Storage
-- Verifique se as políticas para step_documents estão ativas
-- Bucket: contracts (já existente)
```

### 3. Deploy da Aplicação
```bash
# Deploy automático na Vercel ao fazer push
git add .
git commit -m "feat: novo fluxo de 9 etapas com upload duplo na etapa 1"
git push origin main
```

## 📊 Funcionalidades Implementadas

### Etapa 1 - Upload Duplo
- ✅ Upload de ficha de contrato (PDF)
- ✅ Upload de planilha de cálculo (Excel/CSV)
- ✅ Drag & drop interface
- ✅ Validação automática dos dois arquivos
- ✅ Download dos arquivos enviados
- ✅ Status visual da etapa
- ✅ Integração com Supabase Storage

### Compatibilidade
- ✅ Migração automática de dados existentes
- ✅ Mantém compatibilidade com processos antigos
- ✅ Normalização automática dos status

### Interface
- ✅ Kanban atualizado para 9 colunas
- ✅ Progresso geral corrigido para 9 etapas
- ✅ Componente especializado para etapa 1
- ✅ Manutenção do padrão visual para outras etapas

## 🔧 Configurações Técnicas

### Storage Path
```
contracts/step-documents/{processId}/step1/{filename}
```

### Database Schema
- `step_documents` - Tabela para arquivos das etapas
- `processes` - Colunas adicionais para etapa 1
- `process_steps` - 9 etapas padrão

### Status Mapeamento
Dados antigos são automaticamente mapeados:
- `engineering` → `etapa5_solicitacao_engenharia`
- `signature` → `etapa6_assinatura_bancario`
- `itbi` → `etapa7_itbi`
- `registry` → `etapa8_cartorio_registro`
- `delivery` → `etapa9_entrega_chaves`

## ⚠️ Observações Importantes

1. **Backup**: Faça backup do banco antes de executar o script SQL
2. **Teste**: Teste o fluxo completo em ambiente de desenvolvimento
3. **Deploy**: Faça deploy em horário de baixo movimento
4. **Treinamento**: Orientar usuários sobre as novas etapas

## 🎯 Benefícios

- **Mais controle** no início do processo
- **Documentação completa** desde o início
- **Validação automática** dos documentos necessários
- **Interface intuitiva** para upload múltiplo
- **Rastreabilidade** completa dos documentos
- **Compatibilidade** total com dados existentes
