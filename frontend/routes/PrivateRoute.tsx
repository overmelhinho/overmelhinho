import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

type Props = {
  requiredRole?: string;
  requiredPermission?: string;
};

export default function PrivateRoute({ requiredRole, requiredPermission }: Props) {
  const { user, loading, fetchUser } = useAuth(); // vamos supor que seu contexto tenha isso

  // Se o contexto ainda estiver buscando os dados do usuário
  if (loading) {
    return <div className="p-4 text-center">Carregando...</div>;
  }

  // Se não estiver logado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role seguro
  if (requiredRole && (!user.roles || !Array.isArray(user.roles) || !user.roles.includes(requiredRole))) {
    return <div className="p-4 text-center">Acesso negado (Role)</div>;
  }

  // Permissão segura
  if (requiredPermission && (!user.permissions || !Array.isArray(user.permissions) || !user.permissions.includes(requiredPermission))) {
    return <div className="p-4 text-center">Acesso negado (Permission)</div>;
  }

  return <Outlet />;
}
