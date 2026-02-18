import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type ProtectedRouteProps = {
  perms?: string[];
  children: React.ReactNode;
};

export default function ProtectedRoute({ perms = [], children }: ProtectedRouteProps) {
  const { user } = useAuth();

  // Se ainda está carregando o usuário, exibe um loading ou spinner
  // (mantive sua lógica, só deixei mais explícito e seguro)
  if (user === null) {
    return <div>Carregando...</div>;
  }

  // Se não tem usuário autenticado, vai pro login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Garante arrays válidos
  const userPermissions: string[] = Array.isArray(user?.permissions) ? user.permissions : [];
  const userRoles: string[] = Array.isArray(user?.roles) ? user.roles : [];

  // Libera acesso se: não exige perms OU user tem perms OU user é admin
  const hasPermission =
    perms.length === 0 ||
    userPermissions.some((perm) => perms.includes(perm)) ||
    userRoles.includes("admin");

  // Sem permissão: unauthorized
  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
