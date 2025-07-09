import { NavLink } from "react-router-dom";
import { Home, Users, FileText, Settings, LayoutTemplate, Database, Shield, KeyRound } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/contexts/AuthContext";

// Menu principal
const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home, perms: ["view_dashboard"] },
  { to: "/leads", label: "Leads", icon: Users, perms: ["view_lead"] },
  { to: "/clientes", label: "Clientes", icon: Database, perms: ["view_client"] },
  { to: "/relatorios", label: "Relatórios", icon: FileText, perms: ["view_report"] },
  { to: "/criativo", label: "Criativo", icon: LayoutTemplate, perms: ["manage_creative"] },
];

// Menu de configuração/admin
const adminItems = [
  { to: "/configuracoes", label: "Configurações", icon: Settings, perms: ["manage_settings"] },
  { to: "/usuarios", label: "Usuários", icon: Users, perms: ["manage_users", "view users"] }, // ajuste para suas perms reais
  { to: "/funcoes", label: "Funções", icon: Shield, perms: ["manage roles", "manage_roles"] },
  { to: "/permissoes", label: "Permissões", icon: KeyRound, perms: ["manage permissions", "manage_permissions"] },
];

export default function Sidebar() {
  const { user } = useAuth();

  const hasPerm = (itemPerms: string[]) =>
    user?.permissions?.some((perm: string) => itemPerms.includes(perm)) ||
    user?.roles?.includes("admin");

  return (
    <aside className="bg-red-700 text-white w-64 min-h-screen px-4 py-6">
      <div className="text-2xl font-bold mb-8 pl-2">O Vermelhinho</div>
      <nav className="space-y-2">
        {navItems
          .filter((item) => hasPerm(item.perms))
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-4 py-2 rounded-md font-medium transition-colors",
                  isActive ? "bg-red-800" : "hover:bg-red-600"
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
      </nav>
      {/* Separador visual para área admin/config */}
      <div className="mt-8 mb-2 border-t border-red-600"></div>
      <nav className="space-y-2">
        {adminItems
          .filter((item) => hasPerm(item.perms))
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-4 py-2 rounded-md font-medium transition-colors",
                  isActive ? "bg-red-800" : "hover:bg-red-600"
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
}
