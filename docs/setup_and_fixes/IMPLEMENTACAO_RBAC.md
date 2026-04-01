# Implementação do Sistema RBAC Expandido

## 🎯 **Objetivo**
Implementar novos perfis de usuário com acesso apenas leitura (Read-Only) para a equipe interna.

## 👥 **Novos Perfis Adicionados**

### **Equipe Interna (Read-Only)**
- **Secretaria** - Acesso visual a todos os processos
- **Financeiro** - Acesso visual a todos os processos  
- **Administrativo** - Acesso visual a todos os processos
- **Gestor** - Acesso visual a todos os processos

### **Perfis Existentes**
- **Admin** - Acesso total (criar, editar, excluir)
- **Cliente** - Acesso apenas aos próprios processos

## 📁 **Arquivos Alterados**

### 1. **Banco de Dados**
- `ATUALIZAR_RBAC_NOVOS_PERFIS.sql` - Script SQL completo

### 2. **TypeScript Types**
- `types/database.ts` - Atualizado com novas roles

### 3. **Hook de Permissões**
- `lib/usePermissions.ts` - Hook utilitário para verificação de permissões

### 4. **Interface Principal**
- `app/admin/page.tsx` - Substituído por versão com RBAC implementado

### 5. **Componentes Auxiliares**
- `components/PermissionGuard.tsx` - Componente para controle de acesso

## 🔧 **O que foi implementado**

### **No Banco de Dados (SQL)**
```sql
-- 1. Novos roles no ENUM
ALTER TYPE user_role ADD VALUE 'secretaria';
ALTER TYPE user_role ADD VALUE 'financeiro';  
ALTER TYPE user_role ADD VALUE 'administrativo';
ALTER TYPE user_role ADD VALUE 'gestor';

-- 2. Políticas RLS para acesso apenas leitura
CREATE POLICY "Read-only users can view all processes"
  ON processes FOR SELECT
  USING (role IN ('secretaria', 'financeiro', 'administrativo', 'gestor'));
```

### **Nas Tipagens (TypeScript)**
```typescript
export type Profile = {
  role: 'admin' | 'client' | 'secretaria' | 'financeiro' | 'administrativo' | 'gestor';
};
```

### **Hook de Permissões**
```typescript
const permissions = usePermissions(userRole);

// Verificações disponíveis:
permissions.canCreateProcess()     // Admin only
permissions.canEditProcess()      // Admin only  
permissions.canToggleSteps()      // Admin only
permissions.canUploadFiles()     // Admin only
permissions.canViewAllProcesses() // Todos exceto clientes
permissions.isReadOnly()          // Equipe interna
permissions.isAdmin()              // Admin only
```

### **Na Interface (React)**
```typescript
// Botão Criar Processo - só aparece para Admin
{permissions.canCreateProcess() && (
  <Button onClick={() => setShowCreateForm(true)}>
    Criar Processo
  </Button>
)}

// Switches desabilitados para Read-Only
<Switch
  checked={isCompleted}
  onCheckedChange={() => permissions.canToggleSteps() && handleToggle()}
  disabled={!permissions.canToggleSteps()}
/>
```

## 🚀 **Como Usar**

### **1. Executar Script SQL**
```sql
-- Execute no Supabase Dashboard > SQL Editor
-- Arquivo: ATUALIZAR_RBAC_NOVOS_PERFIS.sql
```

### **2. Criar Usuários com Novos Perfis**
```sql
-- Exemplo: Criar usuário Secretaria
INSERT INTO profiles (id, email, full_name, role)
VALUES ('uuid-do-usuario', 'secretaria@imobiliaria.com', 'Ana Maria', 'secretaria');
```

### **3. Usar Hook nas Aplicações**
```typescript
import { usePermissions } from '@/lib/usePermissions';

function MeuComponente() {
  const permissions = usePermissions(userRole);
  
  return (
    <div>
      {permissions.canCreateProcess() && (
        <Button>Criar Processo</Button>
      )}
      
      {permissions.isReadOnly() && (
        <span>Modo apenas leitura</span>
      )}
    </div>
  );
}
```

## 📋 **Regras de Negócio Implementadas**

### ✅ **Equipe Interna (Read-Only)**
1. ✅ PODEM ver lista completa de processos
2. ✅ PODEM clicar em "Ver Status"
3. ✅ PODEM visualizar timeline, detalhes e arquivos
4. ❌ NÃO PODEM criar novos processos
5. ❌ NÃO PODEM editar processos
6. ❌ NÃO PODEM alterar status das etapas
7. ❌ NÃO PODEM fazer upload de arquivos

### ✅ **Admin (Controle Total)**
1. ✅ Todas as permissões anteriores mantidas
2. ✅ Pode criar, editar, excluir processos
3. ✅ Pode alterar status das etapas
4. ✅ Pode fazer upload de arquivos

### ✅ **Cliente (Acesso Limitado)**
1. ✅ Acesso apenas aos próprios processos
2. ✅ Visualização limitada aos seus dados

## 🔄 **Fluxo de Implementação**

1. **Executar script SQL** no Supabase
2. **Build da aplicação** com novas tipagens
3. **Testar com diferentes perfis**
4. **Criar usuários** com os novos cargos
5. **Validar permissões** na interface

## 🎯 **Benefícios**

- **Segurança** - Controle granular de acesso
- **Auditoria** - Cada perfil com responsabilidades claras
- **Escalabilidade** - Fácil adicionar novos perfis
- **Manutenibilidade** - Hook centralizado para permissões

## ⚠️ **Importante**

- **Backup** - Faça backup antes de executar o SQL
- **Teste** - Valide todas as permissões em ambiente de desenvolvimento
- **Documentação** - Oriente os usuários sobre as novas funcionalidades

---

**Status:** ✅ **Implementação Completa**
