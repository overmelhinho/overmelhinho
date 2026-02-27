import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios from "@/services/api";
import {
    BarChart,
    Bar,
    AreaChart,
    Area,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    Cell
} from "recharts";
import {
    DollarSign,
    Zap,
    AlertCircle,
    Search,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Medal,
    Eye,
    MousePointerClick,
    BarChart2,
    TrendingUp as LucideTrendingUp
} from "lucide-react";


export default function AdminReportDashboard() {
    const navigate = useNavigate();
    const { data: report, isLoading } = useQuery({
        queryKey: ["admin-report"],
        queryFn: async () => {
            const resp = await axios.get("/v1/admin/reports/dashboard");
            return resp.data;
        },
        refetchInterval: 5 * 60 * 1000,  // ♻️ Atualiza a cada 5 minutos automaticamente
        staleTime: 4 * 60 * 1000,        // Considera dados frescos por 4 minutos
    });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    if (isLoading) {
        return <div className="p-6 bg-[#F2F2F2] min-h-screen font-black tracking-tighter text-gray-400">Carregando Cockpit...</div>;
    }

    return (
        <div className="p-6 bg-[#F2F2F2] min-h-screen">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Cockpit de Operação Admin</h1>
                    <p className="text-gray-500 font-medium">Saúde financeira e operacional da rede "O Vermelhinho"</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white" />
                        ))}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#C00000]">3 Admins Online</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[220px]">

                {/* CARD FINANCEIRO: REVENUE HERO */}
                <div className="md:col-span-4 md:row-span-2 bg-white rounded-[48px] p-12 border border-gray-100 shadow-sm flex flex-col justify-between overflow-hidden relative">
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#C00000]">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400 block">Faturamento Real (30d)</span>
                                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">Faturas pagas no período</span>
                                </div>
                            </div>
                            <h2 className="text-8xl font-black text-gray-900 tracking-tighter mb-4">
                                {formatCurrency(report?.financeiro?.revenue || 0)}
                            </h2>
                        </div>

                        <div className="flex gap-10 items-end">
                            <div>
                                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1 tracking-widest">MRR Contratado</span>
                                <span className="text-2xl font-black text-blue-600 tracking-tighter">{formatCurrency(report?.financeiro?.mrr || 0)}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1 tracking-widest">Inadimplência</span>
                                <span className="text-2xl font-black text-red-600 tracking-tighter">{report?.financeiro?.default_rate || 0}%</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1 tracking-widest">Ticket Médio</span>
                                <span className="text-2xl font-black text-gray-900 tracking-tighter">{formatCurrency(report?.financeiro?.ticket_medio || 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Background Decor */}
                    <div className="absolute top-[-10%] right-[-10%] scale-150 opacity-[0.03] pointer-events-none text-gray-900">
                        <TrendingUp size={400} />
                    </div>
                </div>

                {/* CARD OPERAÇÃO: IA EFFICIENCY */}
                <div className="md:col-span-2 md:row-span-2 bg-gray-900 rounded-[48px] p-10 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6 text-gray-400">
                            <Zap size={20} className="text-yellow-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Automação de Orçamentos</span>
                        </div>
                        <div className="mb-8">
                            <h3 className="text-6xl font-black text-white mb-2">{report?.operacao?.ai_efficiency || 0}%</h3>
                            <p className="text-sm font-bold text-gray-500 max-w-[150px]">Dos orçamentos foram notificados via IA.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-300">
                                <CheckCircle2 className="text-green-500" size={18} />
                                <span className="text-xs font-bold">{report?.operacao?.quotes_total} Orçamentos Captados</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <Clock className="text-blue-400" size={18} />
                                <span className="text-xs font-bold">{report?.operacao?.avg_response_minutes}m Tempo Médio</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/dashboard/foco')}
                        className="relative z-10 w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                        Ver Fila de Foco
                    </button>

                    <div className="absolute bottom-10 right-10 opacity-10">
                        <Zap size={180} />
                    </div>
                </div>

                {/* CARD GAPS DE BUSCA: MOCK */}
                <div className="md:col-span-3 md:row-span-2 bg-white rounded-[48px] p-10 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <Search size={20} className="text-gray-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Gaps de Busca (Sem Resultado)</span>
                        </div>
                        <AlertCircle className="text-orange-400" size={20} />
                    </div>

                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={report?.search_gaps} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    type="category"
                                    dataKey="term"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fontWeight: 900, fill: '#111827' }}
                                    width={120}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none' }}
                                />
                                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={24}>
                                    {report?.search_gaps?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#C00000' : '#E5E7EB'} />
                                    ))}
                                </Bar>

                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* CARD RANKING: TOP CLIENTES */}
                <div className="md:col-span-3 md:row-span-2 bg-red-600 rounded-[48px] p-10 text-white flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-8">
                            <Medal size={20} className="text-red-200" />
                            <span className="text-xs font-black uppercase tracking-widest text-red-100">Top Clientes (Audiência)</span>
                        </div>

                        <div className="space-y-4">
                            {report?.operacao?.top_clientes?.length > 0 ? (
                                report?.operacao?.top_clientes?.map((cli: any, idx: number) => (
                                    <div key={cli.id} className="flex items-center justify-between group cursor-default">
                                        <div className="flex items-center gap-4">
                                            <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black">{idx + 1}º</span>
                                            <span className="text-sm font-black tracking-tight">{cli.nome_fantasia}</span>
                                        </div>
                                        <ArrowUpRight size={16} className="text-white/40 group-hover:text-white transition-all" />
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm font-medium text-red-100 opacity-50">Aguardando dados de tracking...</p>
                            )}
                        </div>

                    </div>

                    <button
                        onClick={() => navigate('/clientes')}
                        className="w-full py-4 bg-black/20 hover:bg-black/30 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-white"
                    >
                        Ver Ranking Completo
                    </button>
                </div>

            </div>

            {/* =====================================================
                SEÇÃO: Performance e Tráfego do Portal (GA4)
            ===================================================== */}
            <div className="mt-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tighter">Performance e Tráfego do Portal</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Inteligência de dados · Últimos 30 dias · Fonte: Google Analytics 4</p>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-2xl px-4 py-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-700">GA4 Ativo</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

                    {/* CARD: Pageviews Totais */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-8 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Eye size={20} />
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                {report?.trafego?.views_change || "+0%"}
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Pageviews Totais</p>
                            <p className="text-4xl font-black text-gray-900 tracking-tighter">
                                {(report?.trafego?.page_views_total || 0).toLocaleString('pt-BR')}
                            </p>
                            <p className="text-xs text-gray-400 font-medium mt-2">Visualizações no portal</p>
                        </div>
                    </div>

                    {/* CARD: Conversões (WhatsApp + Waze) */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-8 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                                <MousePointerClick size={20} />
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest border border-gray-100">
                                30d
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Conversões Totais</p>
                            <p className="text-4xl font-black text-gray-900 tracking-tighter">
                                {(report?.trafego?.conversions_total || 0).toLocaleString('pt-BR')}
                            </p>
                            <p className="text-xs text-gray-400 font-medium mt-2">Cliques em WhatsApp + Waze</p>
                        </div>
                    </div>

                    {/* CARD: Ranking de Segmentos */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-8 col-span-1 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                                <BarChart2 size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inteligência Comercial</p>
                                <p className="text-xs text-gray-500 font-medium">Top 5 segmentos mais ativos</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {(() => {
                                const segments = report?.trafego?.top_segments || [];
                                const maxUsers = segments.length > 0 ? Math.max(...segments.map((s: any) => s.users)) : 1;
                                return segments.map((seg: any, idx: number) => (
                                    <div key={idx}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-gray-300 w-4">{idx + 1}</span>
                                                <span className="text-xs font-black text-gray-800">{seg.name}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400">{seg.users.toLocaleString('pt-BR')} usuários</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div
                                                className="h-1.5 rounded-full transition-all duration-700"
                                                style={{
                                                    width: `${(seg.users / maxUsers) * 100}%`,
                                                    background: idx === 0
                                                        ? `linear-gradient(90deg, #C00000, #ff4444)`
                                                        : `linear-gradient(90deg, #D1D5DB, #9CA3AF)`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ));
                            })()}
                            {(!report?.trafego?.top_segments || report.trafego.top_segments.length === 0) && (
                                <p className="text-sm text-gray-300 font-medium py-4 text-center">Aguardando dados do GA4...</p>
                            )}
                        </div>
                    </div>

                    {/* CARD: Gráfico de Tráfego (30 dias) */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-8 col-span-1 md:col-span-3 lg:col-span-4">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#C00000]">
                                    <LucideTrendingUp size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tráfego Histórico</p>
                                    <p className="text-xs text-gray-500 font-medium">Visualizações por dia (últimos 30 dias)</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Fonte: GA4</span>
                        </div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={report?.trafego?.history || []}
                                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="ga4TrafficGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#C00000" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#C00000" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 700 }}
                                        tickFormatter={(v) => {
                                            // Formata YYYYMMDD → DD/MM
                                            if (v?.length === 8) return `${v.slice(6)}/${v.slice(4, 6)}`;
                                            return v;
                                        }}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 700 }} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '16px', border: '1px solid #F3F4F6', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.08)', fontSize: 12 }}
                                        labelFormatter={(v) => v?.length === 8 ? `${v.slice(6)}/${v.slice(4, 6)}/${v.slice(0, 4)}` : v}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="views"
                                        name="Visualizações"
                                        stroke="#C00000"
                                        strokeWidth={2.5}
                                        fill="url(#ga4TrafficGradient)"
                                        dot={false}
                                        activeDot={{ r: 5, fill: '#C00000', strokeWidth: 0 }}
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                            {(!report?.trafego?.history || report.trafego.history.length === 0) && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-sm font-black text-gray-200 uppercase tracking-widest">Dados indisponíveis</p>
                                        <p className="text-xs text-gray-300 mt-1">Configure o GA4 para ativar este gráfico</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}


const TrendingUp = ({ className = "", size = 24 }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);
