import { useState } from "react";
import dayjs from "dayjs";
import { UserPlus, Briefcase, TrendingUp } from "lucide-react";
import KpiCard from "./widgets/KpiCard";
import FunilChart from "./widgets/FunilChart";
import TimelineWidget from "./widgets/TimelineWidget";
import TaskListWidget from "./widgets/TaskListWidget";
import DashboardFilter from "@/components/dashboard/DashboardFilter";
import { useDashboardComercialKpis, useTimelineEventos, useTaskList } from "@/hooks/useDashboard";
import { Loader } from "lucide-react";

const kpiConfig = [
  { key: "leads", icon: UserPlus, label: "Meus Leads", color: "bg-primary", text: "text-white" },
  { key: "oportunidades", icon: Briefcase, label: "Minhas Oportunidades", color: "bg-secondary", text: "text-white" },
  { key: "conversao", icon: TrendingUp, label: "Minha Conversão", color: "bg-success", text: "text-white" },
];

export default function DashboardComercial({ user }) {
  const [filtro, setFiltro] = useState({
    start: dayjs().startOf("month").format("YYYY-MM-DD"),
    end: dayjs().endOf("month").format("YYYY-MM-DD"),
  });

  const { data: kpis, isLoading } = useDashboardComercialKpis(filtro);
  const { data: eventos, isLoading: loadingEventos } = useTimelineEventos(filtro);
  const { data: tasks, isLoading: loadingTasks } = useTaskList(filtro);

  return (
    <div className="space-y-10">
      <DashboardFilter onChange={setFiltro} />

      <div className="mb-6 flex items-center gap-3">
        <div className="text-2xl font-extrabold text-gray-800 tracking-tight">
          Painel Comercial
        </div>
        <span className="inline-block px-3 py-1 text-xs rounded-full bg-secondary text-white font-bold">Seu Funil</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {isLoading
          ? kpiConfig.map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
            ))
          : kpiConfig.map((kpi) => (
              <KpiCard
                key={kpi.key}
                icon={kpi.icon}
                value={
                  kpi.key === "conversao"
                    ? kpis?.[kpi.key]
                      ? `${Math.round(kpis[kpi.key] * 100)}%`
                      : "--"
                    : kpis?.[kpi.key] ?? "--"
                }
                label={kpi.label}
                color={kpi.color}
                text={kpi.text}
              />
            ))}
      </div>

      {/* Gráfico Funil */}
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center border border-gray-100">
        <div className="text-lg font-bold mb-4">Meu Funil de Vendas</div>
        <div className="h-36 flex items-center justify-center text-gray-300 w-full">
          <FunilChart />
        </div>
      </div>

      {/* Painel de Tarefas */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="text-lg font-bold mb-4">Minhas Tarefas</div>
        {loadingTasks ? (
          <Loader className="animate-spin m-auto w-8 h-8" />
        ) : (
          <TaskListWidget tasks={tasks || []} />
        )}
      </div>

      {/* Linha do Tempo */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="text-lg font-bold mb-4">Linha do Tempo</div>
        {loadingEventos ? (
          <Loader className="animate-spin m-auto w-8 h-8" />
        ) : (
          <TimelineWidget eventos={eventos || []} />
        )}
      </div>
    </div>
  );
}
