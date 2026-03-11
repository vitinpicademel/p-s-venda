import { Profile } from '@/types/database';

export type UserRole = Profile['role'];

// Hook para verificar permissões do usuário
export function usePermissions(userRole: UserRole | null | undefined) {
  // Verifica se o usuário tem permissão de edição
  const hasEditPermission = (): boolean => {
    if (!userRole) return false;
    return userRole === 'admin';
  };

  // Verifica se o usuário pode criar novos processos
  const canCreateProcess = (): boolean => {
    if (!userRole) return false;
    return userRole === 'admin';
  };

  // Verifica se o usuário pode editar processos
  const canEditProcess = (): boolean => {
    if (!userRole) return false;
    return userRole === 'admin';
  };

  // Verifica se o usuário pode alterar status das etapas
  const canToggleSteps = (): boolean => {
    if (!userRole) return false;
    return userRole === 'admin';
  };

  // Verifica se o usuário pode fazer upload de arquivos
  const canUploadFiles = (): boolean => {
    if (!userRole) return false;
    return userRole === 'admin';
  };

  // Verifica se o usuário pode visualizar processos (todos exceto clientes)
  const canViewAllProcesses = (): boolean => {
    if (!userRole) return false;
    return userRole !== 'client';
  };

  // Verifica se o usuário é cliente (só pode ver os próprios processos)
  const isClient = (): boolean => {
    return userRole === 'client';
  };

  // Verifica se o usuário é admin
  const isAdmin = (): boolean => {
    return userRole === 'admin';
  };

  // Verifica se o usuário é read-only (equipe interna)
  const isReadOnly = (): boolean => {
    if (!userRole) return false;
    return ['secretaria', 'financeiro', 'administrativo', 'gestor'].includes(userRole);
  };

  // Retorna o nome formatado do cargo
  const getRoleDisplayName = (): string => {
    if (!userRole) return 'Desconhecido';
    
    const roleNames = {
      admin: 'Administrador',
      client: 'Cliente',
      secretaria: 'Secretaria',
      financeiro: 'Financeiro',
      administrativo: 'Administrativo',
      gestor: 'Gestor'
    };
    
    return roleNames[userRole] || 'Desconhecido';
  };

  return {
    hasEditPermission,
    canCreateProcess,
    canEditProcess,
    canToggleSteps,
    canUploadFiles,
    canViewAllProcesses,
    isClient,
    isAdmin,
    isReadOnly,
    getRoleDisplayName
  };
}

// Função utilitária para uso fora de componentes React
export function checkPermissions(userRole: UserRole | null | undefined) {
  const permissions = {
    hasEditPermission: () => userRole === 'admin',
    canCreateProcess: () => userRole === 'admin',
    canEditProcess: () => userRole === 'admin',
    canToggleSteps: () => userRole === 'admin',
    canUploadFiles: () => userRole === 'admin',
    canViewAllProcesses: () => userRole !== null && userRole !== 'client',
    isClient: () => userRole === 'client',
    isAdmin: () => userRole === 'admin',
    isReadOnly: () => userRole != null && ['secretaria', 'financeiro', 'administrativo', 'gestor'].includes(userRole as string),
    getRoleDisplayName: () => {
      if (!userRole) return 'Desconhecido';
      
      const roleNames = {
        admin: 'Administrador',
        client: 'Cliente',
        secretaria: 'Secretaria',
        financeiro: 'Financeiro',
        administrativo: 'Administrativo',
        gestor: 'Gestor'
      };
      
      return roleNames[userRole] || 'Desconhecido';
    },
    userRole
  };
  
  return permissions;
}
