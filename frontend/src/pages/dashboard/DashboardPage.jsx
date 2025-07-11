// src/pages/dashboard/DashboardPage.jsx
import { useAuth } from "@/hooks/useAuth"; // Assumindo hook customizado para pegar o user
import DashboardAdmin from "./DashboardAdmin";
import DashboardDiretoria from "./DashboardDiretoria";
import DashboardComercial from "./DashboardComercial";
import DashboardMarketing from "./DashboardMarketing"; // Exemplo de nova função
import DashboardDefault from "./DashboardDefault";
import { Loader } from "lucide-react";

const dashboards = {
  admin: DashboardAdmin,
  diretoria: DashboardDiretoria,
  comercial: DashboardComercial,
  marketing: DashboardMarketing,   // nova função, crie a tela depois!
  default: DashboardDefault,
};

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  const DashboardComponent = dashboards[user?.role] || dashboards.default;

  return (
    <section className="p-6 sm:p-10">
      <DashboardComponent user={user} />
    </section>
  );
}
