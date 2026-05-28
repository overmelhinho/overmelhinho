import React from "react";
import {
    TrendingUp,
    Users,
    DollarSign,
    RefreshCw,
    Target,
    MessageSquare,
    AlertTriangle,
    Briefcase,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Star
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "@/services/api";
import DailyQuote from "@/components/dashboard/DailyQuote";

export default function CommandCenterKPIs() {
    const { data, isLoading } = useQuery({
        queryKey: ["command-center-stats"],
        queryFn: async () => {
            const resp = await axios.get("/v1/dashboard/kpis");
            return resp.data;
        }
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4].map(n => (
                    <div key={n} className="h-32 bg-gray-100 rounded-[32px]"></div>
                ))}
            </div>
        );
    }

    const { sales, financial, operational, funnel } = data;

    return (
        <div className="space-y-8 pb-12">
            {/* Header com Contexto */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Centro de Comando</h1>
                    <p className="text-gray-500 font-medium text-xs">Visão estratégica e inteligência em tempo real.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Sincronizado agora</span>
                </div>
            </div>

            <DailyQuote />

            {/* Top KPIs - Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* 1. Faturamento */}
                <div className="bg-white p-6 rounded-[38px] border border-white shadow-xl shadow-gray-200/50 group hover:scale-[1.02] transition-all">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-green-50 p-3 rounded-2xl text-green-600">
                            <DollarSign size={24} />
                        </div>
                        <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg text-xs font-black">
                            <ArrowUpRight size={14} /> 12%
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Receita Mensal (Estimada)</p>
                    <h3 className="text-xl font-black text-gray-900">R$ {financial.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                </div>

                {/* 2. Conversão */}
                <div className="bg-white p-6 rounded-[38px] border border-white shadow-xl shadow-gray-200/50 group hover:scale-[1.02] transition-all">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                            <Target size={24} />
                        </div>
                        <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-xs font-black">
                            <ArrowUpRight size={14} /> 5%
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Taxa de Conversão</p>
                    <h3 className="text-xl font-black text-gray-900">{sales.conversion_rate}%</h3>
                </div>

                {/* 3. Atendimento */}
                <div className="bg-white p-6 rounded-[38px] border border-white shadow-xl shadow-gray-200/50 group hover:scale-[1.02] transition-all">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-orange-50 p-3 rounded-2xl text-orange-600">
                            <MessageSquare size={24} />
                        </div>
                        <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg uppercase">Críticos: {sales.quotes_emergency}</span>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Orçamentos Pendentes</p>
                    <h3 className="text-xl font-black text-gray-900">{sales.quotes_total}</h3>
                </div>

                {/* 4. Suporte */}
                <div className="bg-white p-6 rounded-[38px] border border-white shadow-xl shadow-gray-200/50 group hover:scale-[1.02] transition-all">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-red-50 p-3 rounded-2xl text-[#C00000]">
                            <Briefcase size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Tickets em Aberto</p>
                    <h3 className="text-xl font-black text-gray-900">{operational.open_tickets}</h3>
                </div>
            </div>

            {/* Middle Section - Insights & Priority */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Lado Esquerdo: Funil e Performance (9 colunas) */}
                <div className="lg:col-span-9 bg-white rounded-[44px] p-6 border border-white shadow-2xl">
                    <div className="flex justify-between items-center mb-10">
                        <h4 className="text-base font-black text-gray-900 flex items-center gap-3">
                            <TrendingUp className="text-[#C00000] w-4 h-4" />
                            Performance de Conversão
                        </h4>
                        <div className="flex gap-2">
                            {['Semana', 'Mês', 'Ano'].map(t => (
                                <button key={t} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${t === 'Mês' ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Visualização de Funil Customizada */}
                    <div className="space-y-6">
                        {funnel.map((item: any, idx: number) => {
                            const maxWidths = [100, 75, 50, 25];
                            return (
                                <div key={idx} className="relative group">
                                    <div className="flex justify-between items-end mb-2 px-2">
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{item.name}</span>
                                        <span className="text-sm font-black text-gray-900">{item.value}</span>
                                    </div>
                                    <div className="h-8 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 p-1">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#C00000] to-[#E00000] rounded-lg shadow-lg transition-all duration-1000 ease-out"
                                            style={{ width: `${maxWidths[idx]}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 grid grid-cols-2 gap-8 pt-10 border-t border-gray-50">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Eficiência por Setor</p>
                            <div className="space-y-4">
                                {operational.tickets_by_sector.map((sect: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-600 capitalize">{sect.setor}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-gray-900 rounded-full" style={{ width: `${(sect.total / operational.open_tickets) * 100}%` }} />
                                            </div>
                                            <span className="text-xs font-black text-gray-900">{sect.total}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-red-50/30 p-6 rounded-[32px] border border-red-50/50 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-red-600 mb-2">
                                <Star size={18} fill="currentColor" />
                                <span className="text-xs font-black uppercase tracking-widest">Alerta de Oportunidade</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900 leading-tight">
                                Existem {sales.quotes_emergency} solicitações emergenciais de novos orçamentos aguardando resposta. Priorize a Fila de Foco.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Lado Direito: Próximas Renovações & Urgências (3 colunas) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Card de Renovações Prioritárias */}
                    <div className="bg-gray-900 rounded-[38px] p-6 text-white shadow-2xl shadow-red-900/10 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

                        <div className="relative">
                             <div className="flex items-center gap-3 mb-3">
                                <div className="bg-white/10 p-1.5 rounded-xl">
                                    <RefreshCw className="text-white" size={16} />
                                </div>
                                <h4 className="text-sm font-black tracking-tight">Vincendos (30 dias)</h4>
                            </div>

                            <div className="mb-4">
                                <h2 className="text-2xl font-black mb-1">{financial.upcoming_renewals}</h2>
                                <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                                    Clientes aguardando o envio do Magic Link.
                                </p>
                            </div>

                            <a href="/financeiro" className="w-full h-11 bg-white text-gray-900 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[9px] tracking-widest hover:bg-red-50 transition-all">
                                Ir para Renovações
                                <ChevronRight size={14} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="bg-white rounded-[38px] p-8 border border-white shadow-xl shadow-gray-200/50">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Saúde dos Clientes</h4>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span className="text-sm font-bold text-gray-700">Clientes Ativos</span>
                                </div>
                                <span className="text-sm font-black text-gray-900">{financial.active_clients}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    <span className="text-sm font-bold text-gray-700">Leads no Funil</span>
                                </div>
                                <span className="text-sm font-black text-gray-900">{sales.total_leads}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-[#C00000] rounded-full" />
                                    <span className="text-sm font-bold text-gray-700">Taxa de Churn</span>
                                </div>
                                <span className="text-sm font-black text-gray-900">2.4%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
