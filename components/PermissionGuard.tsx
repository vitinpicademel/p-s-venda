import { ReactNode } from "react";
import { usePermissions } from "@/lib/usePermissions";

interface PermissionGuardProps {
  children: ReactNode;
  requirePermission?: () => boolean;
  fallback?: ReactNode;
  role?: string | string[];
}

export function PermissionGuard({ 
  children, 
  requirePermission, 
  fallback = null, 
  role 
}: PermissionGuardProps) {
  // Para simplificar, vamos aceitar qualquer role se não houver restrições
  const hasPermission = !requirePermission || requirePermission();
  const hasCorrectRole = !role || (Array.isArray(role) ? role.includes('admin') : role === 'admin');

  if (!hasPermission || !hasCorrectRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Componentes de conveniência
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard 
      requirePermission={() => true} // Você precisará implementar a verificação real
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

export function CanEdit({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard 
      requirePermission={() => true} // Você precisará implementar a verificação real
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

export function CanCreate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard 
      requirePermission={() => true} // Você precisará implementar a verificação real
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}
