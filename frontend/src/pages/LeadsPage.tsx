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
        <KpiCard icon={PhoneCall} label="Em Contato" value={stats?.em_contato ?? "..."} color="bg-[#FDB913]" />
        <KpiCard icon={ArrowRight} label="Convertidos" value={stats?.convertido ?? "..."} color="bg-[#37B24D]" />
        <KpiCard icon={XCircle} label="Perdidos" value={stats?.perdido ?? "..."} color="bg-[#B70F0A]" />
      </div>
      <LeadsTable user={user} />
    </div>
  );
}
