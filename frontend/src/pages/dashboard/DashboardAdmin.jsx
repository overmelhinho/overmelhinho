import { useState } from "react";
import dayjs from "dayjs";
import { TrendingUp, UserPlus, Briefcase, Users, Shield, KeyRound } from "lucide-react";
import KpiCard from "./widgets/KpiCard";
import FunilChart from "./widgets/FunilChart";
import TimelineWidget from "./widgets/TimelineWidget";
import DashboardFilter from "@/components/dashboard/DashboardFilter";
import { useDashboardKpis, useDashboardRecent, useTimelineEventos } from "@/hooks/useDashboard";
import { Loader } from "lucide-react";

const kpiConfig = [
  { key: "leads", icon: UserPlus, label: "Leads Ativos", color: "bg-gradient-to-br from-primary to-secondary", text: "text-white" },
  { key: "oportunidades", icon: Briefcase, label: "Oportunidades", color: "bg-gradient-to-br from-yellow-400 to-orange-500", text: "text-white" },
  { key: "usuarios", icon: Users, label: "Usuários Ativos", color: "bg-gradient-to-br from-green-500 to-emerald-600", text: "text-white" },
  { key: "funcoes", icon: Shield, label: "Funções no Sistema", color: "bg-gradient-to-br from-sky-500 to-blue-800", text: "text-white" },
  { key: "permissoes", icon: KeyRound, label: "Permissões", color: "bg-gradient-to-br from-pink-500 to-purple-600", text: "text-white" },
  { key: "conversao", icon: TrendingUp, label: "Conversão Geral", color: "bg-gradient-to-br from-orange-400 to-pink-500", text: "text-white" },
];

export default function DashboardAdmin({ user }) {
  // Estado do filtro de período
  const [filtro, setFiltro] = useState({
    start: dayjs().startOf("month").format("YYYY-MM-DD"),
    end: dayjs().endOf("month").format("YYYY-MM-DD"),
  });

  const { data: kpis, isLoading: loadingKpis } = useDashboardKpis(filtro);
  const { data: recent, isLoading: loadingRecent } = useDashboardRecent(filtro);
  const { data: eventos, isLoading: loadingEventos } = useTimelineEventos(filtro);

  return (
    <div className="space-y-10">
      {/* Filtro de período */}
      <DashboardFilter onChange={setFiltro} />

      {/* Título do dashboard */}
      <div className="mb-6 flex items-center gap-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">
          Painel do Administrador
        </div>
        <span className="inline-block px-3 py-1 text-xs rounded-full bg-primary text-white font-bold">Acesso Total</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {loadingKpis
          ? Array(6)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="animate-pulse h-24 rounded-2xl bg-gray-100" />
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

      {/* Gráfico do Funil de Vendas */}
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center border border-gray-100">
        <div className="text-lg font-bold mb-4">Funil de Vendas</div>
        <div className="h-36 flex items-center justify-center text-gray-300 w-full">
          <FunilChart />
        </div>
      </div>

      {/* Atalhos rápidos com ícones */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-2">
        <a href="/usuarios" className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg text-white font-bold transition hover:scale-105">
          <Users className="w-7 h-7" />
          Usuários
        </a>
        <a href="/funcoes" className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg text-white font-bold transition hover:scale-105">
          <Shield className="w-7 h-7" />
          Funções
        </a>
        <a href="/permissoes" className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg text-white font-bold transition hover:scale-105">
          <KeyRound className="w-7 h-7" />
          Permissões
        </a>
        <a href="/leads" className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg text-white font-bold transition hover:scale-105">
          <UserPlus className="w-7 h-7" />
          Leads
        </a>
        <a href="/clientes" className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-800 shadow-lg text-white font-bold transition hover:scale-105">
          <Briefcase className="w-7 h-7" />
          Clientes
        </a>
      </div>

      {/* Últimas movimentações */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="text-lg font-bold mb-4">Últimas Movimentações</div>
        {loadingRecent ? (
          <Loader className="animate-spin m-auto w-8 h-8" />
        ) : (
          <ul className="space-y-2">
            {recent && recent.length > 0 ? (
              recent.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <span className="font-bold">{item.tipo}:</span>
                  <span>{item.nome}</span>
                  <span className="text-gray-500 text-xs">{item.info}</span>
                  <span className="ml-auto text-gray-400 text-xs">{item.data}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-400">Nenhuma movimentação recente.</li>
            )}
          </ul>
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
