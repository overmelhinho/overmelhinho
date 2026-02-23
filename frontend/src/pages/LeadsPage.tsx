import LeadsTable from "./leads/LeadsTable";
import { useLeadsStats } from "@/hooks/useLeadsStats";
import { useAuth } from "@/contexts/AuthContext"; // <-- O caminho correto

import { Users, PhoneCall, ArrowRight, XCircle } from "lucide-react";

function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-3 border border-gray-100 min-w-[180px]">
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="font-bold text-xl">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const { user, isLoading: isUserLoading } = useAuth();
  const { data: stats, isLoading: isStatsLoading } = useLeadsStats();

  if (isUserLoading || !user) return <div>Carregando...</div>;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-2 text-[#B70F0A]">Leads</h1>
      <div className="flex flex-wrap gap-4">
        <KpiCard icon={Users} label="Total" value={stats?.total ?? "..."} color="bg-[#B70F0A]" />
        <KpiCard icon={Users} label="Novos" value={stats?.novo ?? "..."} color="bg-[#339AF0]" />
        <KpiCard icon={PhoneCall} label="Em Contato" value={stats?.em_contato ?? "..."} color="bg-[#FDB913]" />
        <KpiCard icon={ArrowRight} label="Convertidos" value={stats?.convertido ?? "..."} color="bg-[#37B24D]" />
        <KpiCard icon={XCircle} label="Perdidos" value={stats?.perdido ?? "..."} color="bg-[#B70F0A]" />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">Previsão de Recuperação (Esteira 3 Meses)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Recuperar Hoje</p>
              <p className="text-2xl font-bold text-blue-900">{stats?.recuperaveis_hoje ?? 0}</p>
            </div>
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <PhoneCall className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm font-medium">Recuperar Amanhã</p>
              <p className="text-2xl font-bold text-amber-900">{stats?.recuperaveis_amanha ?? 0}</p>
            </div>
            <div className="bg-amber-500/10 p-2 rounded-lg">
              <PhoneCall className="w-5 h-5 text-amber-600" />
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-emerald-600 text-sm font-medium">Total no Mês Atual</p>
              <p className="text-2xl font-bold text-emerald-900">{stats?.recuperaveis_mes ?? 0}</p>
            </div>
            <div className="bg-emerald-500/10 p-2 rounded-lg">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>
      <LeadsTable user={user} />
    </div>
  );
}
