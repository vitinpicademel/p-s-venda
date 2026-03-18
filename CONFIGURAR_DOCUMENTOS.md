# 📄 Configuração de Documentos de Comprador e Vendedor

Este guia explica como configurar a funcionalidade de gerenciamento de documentos de compradores e vendedores no sistema.

## ✅ Passo 1: Executar SQL Schema

1. No Supabase Dashboard, vá em **SQL Editor**
2. Abra o arquivo `supabase-documents-schema.sql` do projeto
3. Copie **TODO** o conteúdo do arquivo
4. Cole no SQL Editor do Supabase
5. Clique em **Run**

Isso vai criar:
- ✅ Tabela `process_documents` (documentos de compradores e vendedores)
- ✅ Políticas de segurança (RLS)
- ✅ Trigger para atualizar `updated_at` automaticamente

## ✅ Passo 2: Criar Bucket de Storage

1. No Supabase Dashboard, vá em **Storage**
2. Clique em **New bucket**
3. Configure:
   - **Name:** `documents`
   - **Public bucket:** ❌ **DESMARCADO** (deve ser privado)
4. Clique em **Create bucket**

## ✅ Passo 3: Configurar Políticas do Storage

1. Com o bucket `documents` criado, vá em **SQL Editor**
2. Abra o arquivo `supabase-documents-storage-policies.sql`
3. Copie **TODO** o conteúdo do arquivo
4. Cole no SQL Editor do Supabase
5. Clique em **Run**

Isso vai criar as políticas de segurança para:
- ✅ Admin pode fazer upload de documentos
- ✅ Admin pode visualizar todos os documentos
- ✅ Admin pode deletar documentos
- ✅ Cliente pode visualizar documentos de seus próprios processos

## ✅ Passo 4: Reiniciar o Servidor

1. Pare o servidor atual (Ctrl+C no terminal)
2. Execute novamente:
```bash
npm run dev
```

## 📋 Funcionalidades Implementadas

### Documentos Comuns (Comprador e Vendedor)
- ✅ CPF
- ✅ RG
- ✅ Comprovante de Residência
- ✅ Certidão (varia conforme estado civil):
  - Solteiro: Certidão de Nascimento
  - Casado: Certidão de Casamento
  - Divorciado: Certidão de Casamento com Averbação

### Documentos Específicos do Vendedor
- ✅ Dados Bancários
- ✅ Matrícula do Imóvel

### Dados Pessoais
- ✅ Telefone
- ✅ E-mail
- ✅ Profissão
- ✅ Estado Civil

### Lógica de Cônjuge
- ✅ Quando o estado civil é "Casado", o sistema exibe campos adicionais para:
  - Nome do cônjuge
  - Telefone do cônjuge
  - E-mail do cônjuge
  - Profissão do cônjuge
  - CPF do cônjuge
  - RG do cônjuge

## 🎯 Como Usar

### Na Área Administrativa

1. Acesse um processo existente clicando em **"Ver Detalhes"**
2. Role até a seção **"Documentos"**
3. Clique em **"Adicionar Documentos"** para Comprador ou Vendedor
4. Preencha os dados pessoais
5. Selecione o estado civil
6. Se for casado, preencha os dados do cônjuge
7. Faça upload dos documentos (PDF ou imagens)
8. Clique em **"Salvar Documentos"**

### Visualização

- Os documentos são exibidos em cards separados para Comprador e Vendedor
- Cada card mostra:
  - Status (Completo/Pendente)
  - Contador de documentos (X/Y documentos enviados)
  - Lista de documentos com botão para visualizar/baixar
  - Dados pessoais informados
  - Dados do cônjuge (se aplicável)

## 🔍 Validações

- ✅ Aceita apenas arquivos PDF e imagens (JPG, PNG)
- ✅ Tamanho máximo de arquivo: 10MB
- ✅ Campos obrigatórios são marcados com asterisco (*)
- ✅ Estado civil determina qual tipo de certidão é necessário

## 📁 Estrutura de Arquivos

```
components/
├── ProcessDocumentsForm.tsx    # Formulário de upload
└── ProcessDocumentsList.tsx    # Lista e visualização de documentos

types/
└── documents.ts                 # Tipos TypeScript

supabase-documents-schema.sql           # Schema do banco
supabase-documents-storage-policies.sql # Políticas do Storage
```

## 🆘 Problemas Comuns

### Erro ao fazer upload
- Verifique se o bucket `documents` foi criado
- Verifique se as políticas do Storage foram configuradas
- Verifique se o usuário tem role 'admin'

### Documentos não aparecem
- Verifique se o SQL schema foi executado corretamente
- Verifique se a tabela `process_documents` existe no Supabase (Table Editor)
- Recarregue a página

### Erro "bucket not found"
- Certifique-se de que o bucket `documents` foi criado no Storage
- Verifique se o nome está exatamente como `documents` (minúsculas)

## 📝 Próximos Passos

Após configurar tudo:
1. Teste criar documentos para um processo
2. Teste visualizar os documentos
3. Teste a lógica de cônjuge (estado civil = casado)
4. Verifique se os arquivos estão sendo salvos corretamente no Storage
