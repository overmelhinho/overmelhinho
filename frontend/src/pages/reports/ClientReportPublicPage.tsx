import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
    Eye, MessageCircle, MapPin, TrendingUp, Globe,
    Clock, Users, Printer, BarChart2, Zap, Star, Building2,
    Calendar, ExternalLink, ChevronRight
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

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
        <div className={`rounded-3xl border p-6 flex flex-col items-center text-center gap-2 ${colors[color]} print:shadow-none print:border-gray-200`}>
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
            const res = await axios.get(`${API}/v1/public/reports/${token}`);
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-[#C00000] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 animate-pulse">Carregando Relatório...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 text-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase">Relatório não encontrado</h1>
                    <p className="text-gray-500 text-sm">Link expirado ou token incorreto.</p>
                </div>
            </div>
        );
    }

    const report  = data;
    const cliente = report?.cliente ?? {};
    const ga4     = report?.data?.ga4 ?? {};
    const conv    = report?.data?.conversions ?? {};
    const cities  = ga4?.cities ?? [];

    const totalConversions = (conv.whatsapp ?? 0) + (conv.waze ?? 0) + (conv.social ?? 0);

    return (
        <div className="min-h-screen bg-gray-50 font-sans print:bg-white pb-20 overflow-x-hidden print:pb-0">
            
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .print-bg-red { background-color: #C00000 !important; color: white !important; }
                    .print-shadow-none { box-shadow: none !important; }
                    .print-no-break { page-break-inside: avoid; }
                    @page { margin: 0.5cm; }
                }
            `}} />

            <div className="bg-white border-b border-gray-100 shadow-sm relative overflow-hidden print-bg-red">
                <div className="absolute top-0 right-0 p-20 bg-[#C00000]/5 rounded-full -translate-y-1/2 translate-x-1/2 print:hidden" />
                <div className="max-w-4xl mx-auto px-6 py-12 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 border border-gray-200 print:hidden">
                             <span className="w-1.5 h-1.5 rounded-full bg-[#C00000] animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Relatório de Performance Oficial</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none print:text-white">
                            {cliente.nome_fantasia}
                        </h1>
                        <p className="text-lg text-gray-400 font-medium print:text-white/80">
                            Resultados oficiais coletados em <span className="text-gray-900 font-bold print:text-white">{report.period_label}</span>
                        </p>
                    </div>
                    {cliente.logo_url && (
                        <img src={cliente.logo_url} className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-xl ring-1 ring-gray-100 print:shadow-none" />
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                    <KpiCard icon={<Eye size={20} />} label="Visualizações" value={ga4.total_views ?? 0} sub="Acessos totais" color="blue" />
                    <KpiCard icon={<Users size={20} />} label="Pessoas Únicas" value={ga4.total_users ?? 0} sub="Visitantes distintos" color="purple" />
                    <KpiCard icon={<Clock size={20} />} label="Tempo Médio" value={formatTime(ga4.avg_time ?? 0)} sub="Duração da sessão" color="amber" />
                    <KpiCard icon={<Zap size={20} />} label="Interações" value={ga4.total_events ?? 0} sub="Ações registradas" color="green" />
                </div>

                <section className="print-no-break">
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-2 print:border-gray-200 print:rounded-3xl">
                        <div className="px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-24 md:w-32 min-w-[120px] grayscale hover:grayscale-0 transition-all flex items-center justify-center">
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
                                <div className="text-center border-r border-gray-200 px-4">
                                    <p className="text-lg font-black text-gray-900">{cities.length}</p>
                                    <p className="text-[8px] font-black uppercase text-gray-400">Regiões</p>
                                </div>
                                <div className="text-center px-4">
                                    <p className="text-lg font-black text-blue-600">{(ga4.total_views ?? 0).toLocaleString('pt-BR')}</p>
                                    <p className="text-[8px] font-black uppercase text-gray-400">Total Views</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.1em] text-gray-400 print:bg-gray-100">
                                        <th className="px-8 py-4">Cidade / Página</th>
                                        <th className="px-6 py-4 text-right">Views</th>
                                        <th className="px-6 py-4 text-right">Pessoas</th>
                                        <th className="px-6 py-4 text-right">Tempo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 transition-all">
                                    {cities.map((city: any, idx: number) => (
                                        <tr key={idx} className={`group ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'} print:bg-white`}>
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

                <section className="space-y-6 print-no-break">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={18} className="text-emerald-500" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Conversões Coletadas</h2>
                    </div>
                    
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 print:border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 print:grid-cols-3">
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 print:bg-white"><MessageCircle size={24} /></div>
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-gray-900">{conv.whatsapp ?? 0}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-green-700">Cliques no WhatsApp</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 print:bg-white"><MapPin size={24} /></div>
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-gray-900">{conv.waze ?? 0}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Waze / Google Maps</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 print:bg-white"><TrendingUp size={24} /></div>
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-gray-900">{conv.social ?? 0}</p>
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
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/50 mb-4 print:text-white">Mensagem da Equipe O Vermelhinho</h3>
                        <p className="text-lg md:text-xl font-bold leading-relaxed">{report.notes}</p>
                    </section>
                )}

                <footer className="text-center pt-10 pb-10 space-y-4">
                    <img src="https://www.overmelhinho.com.br/wp-content/uploads/2021/05/logo_v_red.png" className="h-8 mx-auto opacity-20 grayscale print:opacity-40" alt="Logo" />
                    <div className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">
                        O Vermelhinho · Inteligência e Dados
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
