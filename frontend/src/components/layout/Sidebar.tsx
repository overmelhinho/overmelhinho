import { NavLink } from "react-router-dom";
import { Home, Users, FileText, Settings, LayoutTemplate, Database } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/contexts/AuthContext";

// Adicione o campo `perms` conforme o mapeamento real
const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home, perms: ["view_dashboard"] },
  { to: "/leads", label: "Leads", icon: Users, perms: ["view_lead"] },
  { to: "/clientes", label: "Clientes", icon: Database, perms: ["view_client"] },
  { to: "/relatorios", label: "Relatórios", icon: FileText, perms: ["view_report"] },
  { to: "/criativo", label: "Criativo", icon: LayoutTemplate, perms: ["manage_creative"] },
  { to: "/configuracoes", label: "Configurações", icon: Settings, perms: ["manage_settings"] },
];

export default function Sidebar() {
  const { user } = useAuth(); // Aqui você pega as perms/roles do usuário logado

  // Função utilitária para verificar permissão
  const hasPerm = (itemPerms: string[]) =>
    user?.permissions?.some((perm: string) => itemPerms.includes(perm)) ||
    user?.roles?.includes("admin"); // Admin vê tudo (opcional)

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
    </aside>
  );
}
