import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type ProtectedRouteProps = {
  perms?: string[];
  children: React.ReactNode;
};

export default function ProtectedRoute({ perms = [], children }: ProtectedRouteProps) {
  // ✅ CORRIGIDO: usa isLoading para distinguir "ainda buscando" de "não autenticado"
  const { user, isLoading } = useAuth();

  // Enquanto ainda está buscando o usuário, exibe spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Carregamento concluído e não há usuário → redirect para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Garante arrays válidos
  const userPermissions: string[] = Array.isArray(user?.permissions) ? user.permissions : [];
  // ✅ CORRIGIDO: comparação case-insensitive para o role Admin
  const userRoles: string[] = Array.isArray(user?.roles)
    ? user.roles.map((r) => r.toLowerCase())
    : [];

  // Libera acesso se: não exige perms OU user tem a perm OU user é Admin (qualquer capitalização)
  const hasPermission =
    perms.length === 0 ||
    userPermissions.some((perm) => perms.includes(perm)) ||
    userRoles.includes("admin") ||
    userRoles.includes("administrador");

  // Sem permissão: unauthorized
  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
