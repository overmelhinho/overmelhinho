import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

import {
    Eye, MessageCircle, MapPin, TrendingUp, Globe,
    Clock, Users, Printer, BarChart2, Zap, Star, Building2,
    Calendar, ExternalLink, ChevronRight, Search
} from "lucide-react";

function formatTime(seconds: number): string {
    if (!seconds) return "0s";
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}min ${s}s` : `${m}min`;
}

function KpiCard({ icon, label, value, sub, color = "blue" }: {
    icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
    const colors: Record<string, string> = {
        blue:   "bg-white border-blue-100 text-blue-600 shadow-sm",
        green:  "bg-white border-green-100 text-green-600 shadow-sm",
        purple: "bg-white border-purple-100 text-purple-600 shadow-sm",
        amber:  "bg-white border-white-50 text-amber-600 shadow-sm",
    };
    return (
        <div className={`rounded-3xl border p-6 flex flex-col items-center text-center gap-2 ${colors[color]} print:shadow-none print:border-gray-200 print:bg-white !print:color-adjust-exact`}>
            <div className="mb-2 p-3 rounded-2xl bg-gray-50 print:bg-white">{icon}</div>
            <p className="text-3xl font-black text-gray-900 tracking-tighter">
                {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
            {sub && <p className="text-[10px] text-gray-400 font-medium">{sub}</p>}
        </div>
    );
}

export default function ClientReportPublicPage() {
    const { token } = useParams<{ token: string }>();

    const { data, isLoading, error } = useQuery({
        queryKey: ["public-report", token],
        queryFn: async () => {
            const res = await api.get(`/v1/public/reports/${token}`);
            return res.data;
        },
        enabled: !!token,
    });

    useEffect(() => {
        if (data?.cliente?.nome_fantasia) {
            document.title = `Relatório de Performance — ${data.cliente.nome_fantasia}`;
        }
    }, [data]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-[#C00000] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 animate-pulse tracking-widest">Carregando Relatório...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 text-center font-sans">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase">Relatório não encontrado</h1>
                    <p className="text-gray-500 text-sm">Este link pode ter expirado ou o token está incorreto.</p>
                </div>
            </div>
        );
    }

    const report  = data;
    const cliente = report?.cliente ?? {};
    const ga4     = report?.data?.ga4 ?? {};
    const conv    = report?.data?.conversions ?? {};
    const custom  = report?.data?.custom_metrics ?? {};
    const cities  = ga4?.cities ?? [];

    const wazeClicks   = custom.clicks_waze ?? conv.waze ?? 0;
    const whatsClicks  = custom.clicks_whats ?? conv.whatsapp ?? 0;
    const socialClicks = conv.social ?? 0;

    const totalConversions = wazeClicks + whatsClicks + socialClicks;

    return (
        <div className="min-h-screen bg-gray-50 font-sans print:bg-white pb-20 overflow-x-hidden print:pb-0">
            
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body { 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                        background-color: white !important;
                    }
                    .print-bg-red { 
                        background-color: #C00000 !important; 
                        color: white !important; 
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print-text-white { color: white !important; }
                    .print-shadow-none { box-shadow: none !important; }
                    .print-no-break { page-break-inside: avoid; break-inside: avoid; }
                    .print-hidden { display: none !important; }
                    @page { margin: 1cm; size: A4; }
                }
            `}} />

            {/* ── Hero Headline ────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-100 shadow-sm relative overflow-hidden print-bg-red">
                <div className="absolute top-0 right-0 p-20 bg-[#C00000]/5 rounded-full -translate-y-1/2 translate-x-1/2 print:hidden" />
                <div className="max-w-4xl mx-auto px-6 py-12 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 border border-gray-200 print-hidden">
                             <span className="w-1.5 h-1.5 rounded-full bg-[#C00000] animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Relatório Exclusivo</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none print:text-white print-text-white">
                            {cliente.nome_fantasia}
                        </h1>
                        <p className="text-lg text-gray-400 font-medium print:text-white/80 print-text-white">
                            Resultados oficiais coletados em <span className="text-gray-900 font-bold print:text-white print-text-white">{report.period_label}</span>
                        </p>
                    </div>
                    {cliente.logo_url && (
                        <div className="print-no-break">
                            <img src={cliente.logo_url} className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-xl ring-1 ring-gray-100 print:shadow-none" />
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-10 space-y-12 print:space-y-6 print:py-6">

                {/* ── KPIs Hero (As 6 Métricas) ────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print-no-break">
                    <KpiCard icon={<Eye size={20} />} label="Views Gerais" value={custom.views_geral ?? ga4.total_views ?? 0} sub="Acessos Totais" color="blue" />
                    <KpiCard icon={<BarChart2 size={20} />} label="Views por Segmento" value={custom.views_segmento ?? 0} sub="Impressões na busca" color="purple" />
                    <KpiCard icon={<Globe size={20} />} label="Views nas Cidades" value={custom.views_cidade ?? 0} sub="Presença regional" color="amber" />
                    <KpiCard icon={<Search size={20} />} label="Acessos Diretos" value={custom.views_direto ?? 0} sub="Procuraram seu perfil" color="green" />
                </div>

                {/* ── Seção Tabela Inteligente ─────────────────────────────── */}
                <section>
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-2 print:border-gray-200 print:rounded-3xl">
                        <div className="px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-24 md:w-32 min-w-[120px] grayscale hover:grayscale-0 transition-all flex items-center justify-center print:grayscale-0">
                                    <img src="/ga4-logo.png" alt="Google Analytics" className="max-w-full h-auto object-contain block" />
                                </div>
                                <div className="h-10 w-[1px] bg-gray-200 hidden md:block" />
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-none mb-1">Presença Geográfica</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#C00000]">
                                        {report.period_label}
                                    </p>
                                </div>
                            </div>
                            <div className="flex bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100 print:bg-white">
                                <div className="text-center px-4">
                                    <p className="text-lg font-black text-blue-600">{(ga4.total_views ?? 0).toLocaleString('pt-BR')}</p>
                                    <p className="text-[8px] font-black uppercase text-gray-400">Total Views</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.1em] text-gray-400 print:bg-gray-100 print:text-gray-900">
                                        <th className="px-8 py-4">Cidade / Página</th>
                                        <th className="px-6 py-4 text-right">Views</th>
                                        <th className="px-6 py-4 text-right">Pessoas</th>
                                        <th className="px-6 py-4 text-right">Tempo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 transition-all">
                                    {cities.map((city: any, idx: number) => (
                                        <tr key={idx} className={`group ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'} print:bg-white print-no-break`}>
                                            <td className="px-8 py-4">
                                                <p className="text-xs font-bold text-blue-600 truncate max-w-[250px]">{city.title}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-xs font-black text-gray-900">{city.views.toLocaleString('pt-BR')}</p>
                                                <div className="w-16 h-1 bg-gray-100 rounded-full ml-auto mt-1 overflow-hidden print:hidden">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${city.pct_views}%` }} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-xs font-black text-gray-900">{city.users.toLocaleString('pt-BR')}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase">{city.pct_users}%</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Clock size={10} className="text-gray-300" />
                                                    <p className="text-xs font-black text-gray-900">{formatTime(city.avg_time)}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section className="space-y-6 print:space-y-4 print-no-break">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={18} className="text-emerald-500" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Conversões Coletadas</h2>
                    </div>
                    
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 print:border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 print:grid-cols-3">
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 print:bg-white"><MessageCircle size={24} /></div>
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-gray-900">{whatsClicks}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-green-700">Cliques no WhatsApp</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 print:bg-white"><MapPin size={24} /></div>
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-gray-900">{wazeClicks}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Waze / Google Maps</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 print:bg-white"><TrendingUp size={24} /></div>
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-gray-900">{socialClicks}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-700">Acessos Sociais</p>
                                </div>
                            </div>
                        </div>

                        {totalConversions > 0 && (
                            <div className="mt-12 p-6 bg-black rounded-3xl text-center text-white relative overflow-hidden print:bg-gray-900">
                                <p className="text-3xl font-black mb-1">{totalConversions} ações imediatas</p>
                                <p className="text-xs opacity-60 font-medium tracking-wide">Pessoas saindo do portal para contatar seu negócio agora.</p>
                            </div>
                        )}
                    </div>
                </section>

                {report.notes && (
                    <section className="bg-[#C00000] rounded-[2.5rem] p-10 text-white shadow-2xl print-bg-red print-no-break">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/50 mb-4 print:text-white print-text-white">Mensagem da Equipe O Vermelhinho</h3>
                        <p className="text-lg md:text-xl font-bold leading-relaxed">{report.notes}</p>
                    </section>
                )}

                <footer className="text-center pt-10 pb-10 space-y-4 print-no-break">
                     <div className="text-[9px] font-black uppercase tracking-[0.4em] text-[#C00000] mb-2">
                        O Vermelhinho
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                        Inteligência em Dados e Negócios
                    </div>
                </footer>

            </div>

            <div className="fixed bottom-8 right-8 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl shadow-2xl hover:bg-black active:scale-95 transition-all"
                >
                    <Printer size={16} /> Salvar em PDF / Imprimir
                </button>
            </div>
        </div>
    );
}
