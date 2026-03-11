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
  const permissions = usePermissions(null); // Você precisará passar o role real

  // Se não há requisição de permissão, mostra o children
  if (!requirePermission && !role) {
    return <>{children}</>;
  }

  // Verifica permissão específica
  if (requirePermission && !requirePermission()) {
    return <>{fallback}</>;
  }

  // Verifica role específico
  if (role && typeof role === 'string') {
    const allowedRoles = [role];
    if (!allowedRoles.includes(permissions.userRole)) {
      return <>{fallback}</>;
    }
  }

  if (role && Array.isArray(role)) {
    if (!role.includes(permissions.userRole)) {
      return <>{fallback}</>;
    }
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
