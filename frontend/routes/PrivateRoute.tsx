import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  requiredRole?: string;
  requiredPermission?: string;
};

export default function PrivateRoute({ requiredRole, requiredPermission }: Props) {
  const { user } = useAuth();

  // 1. Se não estiver logado, redireciona
  if (!user) return <Navigate to="/login" replace />;

  // 2. Se exigir role e o user não tiver, bloqueia
  if (requiredRole && !user.roles.includes(requiredRole)) {
    return <div className="p-4 text-center">Acesso negado (Role)</div>;
  }

  // 3. Se exigir permissão e o user não tiver, bloqueia
  if (requiredPermission && !user.permissions.includes(requiredPermission)) {
    return <div className="p-4 text-center">Acesso negado (Permission)</div>;
  }

  // 4. Se passou, libera a rota interna
  return <Outlet />;
}
