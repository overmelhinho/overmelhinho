// /var/www/frontend/src/components/layout/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  UserCog,
  ShieldCheck,
  KeyRound,
  FileText,
  Palette,
  Ticket,
  Settings,
  Megaphone,
  UserPlus,
  Briefcase,
  CreditCard,
  DollarSign, // Financeiro
  Target,
  MessageCircle,
} from "lucide-react";

type Item = {
  to: string;
  label: string;
  icon: React.ReactNode;
  perms?: string[];
};

function hasAnyPerm(userPerms: string[], perms?: string[]) {
  if (!perms || perms.length === 0) return true;
  return userPerms.some((p) => perms.includes(p));
}

export default function Sidebar() {
  const { user } = useAuth();

  const userPermissions: string[] = Array.isArray(user?.permissions)
    ? user!.permissions
    : [];
  const userRoles: string[] = Array.isArray(user?.roles) ? user!.roles : [];
  const isAdmin = userRoles.includes("admin");

  const itemsTop: Item[] = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      perms: ["view_dashboard"],
    },
    {
      to: "/dashboard/foco",
      label: "Fila de Foco",
      icon: <Target size={18} />,
    },

    { to: "/leads-kanban", label: "Leads", icon: <UserPlus size={18} />, perms: ["view_lead"] },

    { to: "/clientes", label: "Clientes", icon: <Users size={18} />, perms: ["view_client"] },
    {
      to: "/campanhas",
      label: "Campanhas",
      icon: <Megaphone size={18} />,
      perms: ["view_campanhas", "manage_campanhas"],
    },
    {
      to: "/orcamentos",
      label: "Orçamentos IA",
      icon: <MessageCircle size={18} />,
      perms: ["view_dashboard"],
    },
    {
      to: "/financeiro",
      label: "Financeiro",
      icon: <DollarSign size={18} />,
      perms: ["view_financial"],
    },
    { to: "/relatorios", label: "Relatórios", icon: <FileText size={18} />, perms: ["view_report"] },
    { to: "/tickets", label: "Tickets", icon: <Ticket size={18} /> },
    { to: "/vagas", label: "Vagas PRO", icon: <Briefcase size={18} /> },
  ];

  const itemsBottom: Item[] = [
    { to: "/usuarios", label: "Usuários", icon: <UserCog size={18} />, perms: ["manage_users"] },
    { to: "/funcoes", label: "Funções", icon: <ShieldCheck size={18} />, perms: ["manage roles", "manage_roles"] },
    { to: "/permissoes", label: "Permissões", icon: <KeyRound size={18} />, perms: ["manage permissions", "manage_permissions"] },
    { to: "/planos", label: "Planos", icon: <CreditCard size={18} /> },
  ];


  const renderItem = (it: Item) => {
    const allowed = isAdmin || hasAnyPerm(userPermissions, it.perms);
    if (!allowed) return null;

    return (
      <NavLink key={it.to} to={it.to} className="block">
        {({ isActive }) => (
          <div
            className={[
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              "border border-transparent",
              isActive
                ? "bg-white text-slate-900 border-white/60 shadow-sm"
                : "text-white/85 hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            <span
              className={[
                "shrink-0 rounded-lg p-1.5 transition",
                isActive ? "bg-slate-900/5" : "bg-white/0 group-hover:bg-white/10",
              ].join(" ")}
            >
              {it.icon}
            </span>
            <span className="truncate">{it.label}</span>
          </div>
        )}
      </NavLink>
    );
  };


  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/10 bg-gradient-to-b from-[#B70F0A] to-[#8A0B07] text-white lg:flex flex-col">
      <div className="px-6 py-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <span className="text-lg font-black">V</span>
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-extrabold tracking-tight">
              O Vermelhinho
            </div>
            <div className="text-xs text-white/70">Admin • SaaS</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 overflow-x-hidden scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-white/40">
        <nav>
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-white/60">
            Operação
          </div>
          <div className="space-y-1">{itemsTop.map(renderItem)}</div>
        </nav>

        <div className="mt-6 border-t border-white/15 pt-4 pb-10">
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-white/60">
            Administração
          </div>
          <div className="space-y-1">{itemsBottom.map(renderItem)}</div>
        </div>
      </div>
    </aside>
  );
}
