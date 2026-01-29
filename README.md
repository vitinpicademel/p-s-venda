# Sistema de Acompanhamento Pós-Venda Imobiliário

Sistema web desenvolvido com Next.js 14, TypeScript, Tailwind CSS e Supabase para permitir que imobiliárias gerenciem processos de venda e clientes acompanhem o progresso da documentação até a entrega das chaves.

## 🚀 Tecnologias

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Shadcn UI**
- **Supabase** (Auth, Database, Storage)
- **Lucide React** (Ícones)

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

## 🛠️ Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. Execute o SQL no Supabase:
   - Acesse o Supabase Dashboard
   - Vá em SQL Editor
   - Execute o conteúdo do arquivo `supabase-schema.sql`

5. Configure o Storage no Supabase:
   - Vá em Storage
   - Crie um bucket chamado `contracts` (privado)
   - Configure as políticas de acesso conforme comentado no SQL

6. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
SistemaContrato/
├── app/                    # App Router do Next.js
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página inicial (redireciona para login)
│   ├── globals.css        # Estilos globais
│   ├── login/             # Página de login
│   ├── admin/             # Área do admin
│   └── client/            # Área do cliente
├── components/            # Componentes React
│   └── ui/               # Componentes Shadcn UI
├── lib/                  # Utilitários e configurações
│   ├── supabase/        # Clientes Supabase
│   └── utils.ts         # Funções utilitárias
├── supabase-schema.sql   # Schema do banco de dados
└── package.json
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas

- **profiles**: Perfis de usuários (admin/client)
- **processes**: Processos de venda
- **process_steps**: Etapas de cada processo

### Etapas Automáticas

Quando um processo é criado, as seguintes etapas são geradas automaticamente:

1. Upload do Contrato (Concluída automaticamente)
2. Engenharia do banco (Pendente)
3. Assinatura do contrato bancário (Pendente)
4. Recolhimento de ITBI (Pendente)
5. Entrada cartório para registro (Pendente)
6. Processo Finalizado (Concluída quando todas acima estiverem prontas)

## 👥 Atores

### Admin (Corretor/Imobiliária)
- Criar novos processos
- Upload de contratos PDF
- Visualizar lista de processos
- Marcar etapas como concluídas

### Cliente (Comprador)
- Login via magic link ou email/senha
- Visualizar apenas seu próprio processo
- Ver timeline visual com status de cada etapa

## 🚀 Deploy na Vercel

O projeto está configurado e pronto para deploy na Vercel.

### Pré-requisitos para Deploy

1. **Conta na Vercel**: [vercel.com](https://vercel.com)
2. **Projeto no Supabase**: Configure o banco de dados antes do deploy

### Passos para Deploy

1. **Conecte seu repositório à Vercel**:
   - Acesse [vercel.com/new](https://vercel.com/new)
   - Conecte seu repositório Git (GitHub, GitLab ou Bitbucket)
   - A Vercel detectará automaticamente o Next.js

2. **Configure as variáveis de ambiente**:
   - Na Vercel, vá em **Settings** → **Environment Variables**
   - Adicione as seguintes variáveis:
     ```
     NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
     NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
     ```
   - Certifique-se de adicionar para os ambientes: **Production**, **Preview** e **Development**

3. **Deploy**:
   - Clique em **Deploy**
   - A Vercel fará o build automaticamente
   - O projeto estará disponível em alguns minutos

### Validação de Variáveis de Ambiente

O projeto inclui validação automática das variáveis de ambiente. Se as variáveis do Supabase não estiverem configuradas, você receberá um erro claro indicando o problema.

### Arquivo `.env.example`

O arquivo `.env.example` está incluído no repositório com as variáveis necessárias. Use-o como referência para configurar seu `.env.local` localmente e as variáveis de ambiente na Vercel.

## 📝 Próximos Passos

- [ ] Implementar página de login
- [ ] Criar dashboard do admin
- [ ] Criar área do cliente com timeline
- [ ] Implementar upload de contratos
- [ ] Adicionar notificações em tempo real

