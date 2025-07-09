import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ perms = [], children }) {
  const { user } = useAuth();

  // Se ainda está carregando o usuário, exibe um loading ou spinner
  if (user === null) {
    return <div>Carregando...</div>;
  }

  // Garante arrays válidos
  const userPermissions = user?.permissions || [];
  const userRoles = user?.roles || [];

  // Libera acesso se: não exige perms OU user tem perms OU user é admin
  const hasPermission =
    perms.length === 0 ||
    userPermissions.some((perm) => perms.includes(perm)) ||
    userRoles.includes("admin");

  if (!user) return <Navigate to="/login" replace />;
  if (!hasPermission) return <Navigate to="/unauthorized" replace />;
  return children;
}
