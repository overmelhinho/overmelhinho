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
    TrendingUp as LucideTrendingUp,
    Globe,
    Smartphone,
    Monitor,
    FileText,
    Calendar,
    ChevronDown,
    LayoutDashboard
} from "lucide-react";
import { useState } from "react";


export default function AdminReportDashboard({ hideHeader = false }: { hideHeader?: boolean }) {
    const navigate = useNavigate();
    const [period, setPeriod] = useState("30d");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const { data: report, isLoading, isFetching } = useQuery({
        queryKey: ["admin-report", period, startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams({ period });
            if (startDate) params.append("start_date", startDate);
            if (endDate) params.append("end_date", endDate);
            
            const resp = await axios.get(`/v1/admin/reports/dashboard?${params.toString()}`);
            return resp.data;
        },
        refetchInterval: 5 * 60 * 1000, 
        staleTime: 4 * 60 * 1000,
        keepPreviousData: true,
    });

    // ❇️ Nova consulta específica para Tempo Real (Intervalo curto: 30s)
    const { data: realtimeData } = useQuery({
        queryKey: ["admin-realtime"],
        queryFn: async () => {
            const resp = await axios.get(`/v1/admin/reports/realtime`);
            return resp.data;
        },
        refetchInterval: 30 * 1000, // Atualiza a cada 30 segundos
    });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    if (isLoading && !report) {
        return <div className="p-6 bg-[#F2F2F2] min-h-screen font-bold tracking-tighter text-gray-400 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#C00000] border-t-transparent rounded-full animate-spin" />
                Carregando Cockpit de Operação...
            </div>
        </div>;
    }

    return (
        <div className="p-6 bg-[#F2F2F2] min-h-screen">
            {!hideHeader && (
                <header className="mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tighter">Cockpit de Operação Admin</h1>
                        <p className="text-gray-400 font-medium text-xs">Saúde financeira e operacional da rede "O Vermelhinho"</p>
                    </div>
                    <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white" />
                            ))}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#C00000]">3 Admins Online</span>
                    </div>
                </header>
            )}

            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[220px]">

                {/* CARD FINANCEIRO: REVENUE HERO */}
                <div className="md:col-span-4 md:row-span-2 bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col justify-between overflow-hidden relative">
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#C00000]">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400 block">Faturamento Real (30d)</span>
                                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">Faturas pagas no período</span>
                                </div>
                            </div>
                            <h2 className="text-6xl font-bold text-gray-900 tracking-tighter mb-2">
                                {formatCurrency(report?.financeiro?.revenue || 0)}
                            </h2>
                        </div>

                        <div className="flex gap-10 items-end">
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1 tracking-widest">MRR Contratado</span>
                                <span className="text-xl font-bold text-gray-900 tracking-tighter">{formatCurrency(report?.financeiro?.ticket_medio || 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Background Decor */}
                    <div className="absolute top-[-10%] right-[-10%] scale-150 opacity-[0.03] pointer-events-none text-gray-900">
                        <LucideTrendingUp size={400} />
                    </div>
                </div>

                {/* CARD OPERAÇÃO: IA EFFICIENCY */}
                <div className="md:col-span-2 md:row-span-2 bg-gray-900 rounded-[32px] p-8 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6 text-gray-400">
                            <Zap size={20} className="text-yellow-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Automação de Orçamentos</span>
                        </div>
                        <div className="mb-6">
                            <h3 className="text-5xl font-bold text-white mb-1">{report?.operacao?.ai_efficiency || 0}%</h3>
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
                        className="relative z-10 w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all"
                    >
                        Ver Fila de Foco
                    </button>

                    <div className="absolute bottom-10 right-10 opacity-10">
                        <Zap size={180} />
                    </div>
                </div>

                {/* CARD GAPS DE BUSCA: MOCK */}
                <div className="md:col-span-3 md:row-span-2 bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <Search size={20} className="text-gray-400" />
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Gaps de Busca (Sem Resultado)</span>
                        </div>
                        <AlertCircle className="text-orange-400" size={20} />
                    </div>

                    <div className="h-[200px] w-full">
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
                <div className="md:col-span-3 md:row-span-2 bg-white rounded-[32px] p-8 border border-red-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-8">
                            <Medal size={20} className="text-red-600" />
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Top Clientes (Audiência)</span>
                        </div>

                        <div className="space-y-4">
                            {report?.operacao?.top_clientes?.length > 0 ? (
                                report?.operacao?.top_clientes?.map((cli: any, idx: number) => (
                                    <div key={cli.id} className="flex items-center justify-between group cursor-default">
                                        <div className="flex items-center gap-4">
                                            <span className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center text-[10px] font-bold text-red-600">{idx + 1}º</span>
                                            <span className="text-sm font-bold tracking-tight text-gray-800">{cli.nome_fantasia}</span>
                                        </div>
                                        <ArrowUpRight size={16} className="text-gray-300 group-hover:text-red-600 transition-all" />
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm font-medium text-gray-400 opacity-50">Aguardando dados de tracking...</p>
                            )}
                        </div>

                    </div>

                    <button
                        onClick={() => navigate('/clientes')}
                        className="w-full py-4 bg-red-50 hover:bg-red-100 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all text-red-600"
                    >
                        Ver Ranking Completo
                    </button>
                </div>

            </div>

            {/* =====================================================
                SEÇÃO: Performance e Tráfego do Portal (GA4)
            ===================================================== */}
            <div className="mt-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold text-gray-900 tracking-tighter">Performance e Tráfego do Portal</h2>
                            {isFetching && <div className="w-4 h-4 border-2 border-[#C00000] border-t-transparent rounded-full animate-spin" />}
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Inteligência de dados em tempo real · Fonte: Google Analytics 4</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm overflow-x-auto whitespace-nowrap">
                        <div className="flex items-center gap-1 border-r border-gray-100 pr-3 mr-1">
                            {[
                                { id: '7d', label: '7d' },
                                { id: '30d', label: '30d' },
                                { id: 'this_month', label: 'Mês Atual' },
                                { id: 'last_month', label: 'Mês Ant.' },
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setPeriod(p.id);
                                        setStartDate("");
                                        setEndDate("");
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                        period === p.id && !startDate
                                        ? 'bg-[#C00000] text-white' 
                                        : 'text-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <label className="text-[9px] font-bold text-gray-400 uppercase">De:</label>
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setPeriod('custom');
                                    }}
                                    className="bg-gray-50 border-none rounded-lg px-2 py-1 text-[10px] font-bold text-gray-700 focus:ring-1 focus:ring-red-200"
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <label className="text-[9px] font-bold text-gray-400 uppercase">Até:</label>
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setPeriod('custom');
                                    }}
                                    className="bg-gray-50 border-none rounded-lg px-2 py-1 text-[10px] font-bold text-gray-700 focus:ring-1 focus:ring-red-200"
                                />
                            </div>
                            {(startDate || endDate) && (
                                <button 
                                    onClick={() => { setStartDate(""); setEndDate(""); setPeriod("30d"); }}
                                    className="text-[9px] font-bold text-red-500 uppercase hover:underline ml-1"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-2xl px-4 py-2 self-start md:self-auto">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-green-700">GA4 Conectado</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

                    {/* CARD: Realtime Monitor (Destaque) */}
                    <div className="md:col-span-3 lg:col-span-4 bg-gradient-to-r from-gray-900 to-black rounded-[32px] p-8 text-white relative overflow-hidden border border-white/5 shadow-2xl">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-center">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-full border-4 border-white/10 flex items-center justify-center">
                                            <span className="text-xl font-bold tracking-tighter">{realtimeData?.activeUsers ?? report?.trafego?.realtime?.activeUsers ?? 0}</span>
                                        </div>
                                        <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-black" />
                                    </div>
                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 mt-2">Usuários Online</span>
                                </div>
                                <div className="h-12 w-px bg-white/10 hidden md:block" />
                                <div>
                                    <h3 className="text-xl font-bold tracking-tighter flex items-center gap-2">
                                        Monitor em Tempo Real
                                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md font-bold text-gray-400">Últimos 30 min</span>
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">Atividade detectada no portal agora mesmo</p>
                                </div>
                            </div>

                            <div className="flex-1 w-full md:max-w-md">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                                    <TrendingUp size={12} className="text-green-500" />
                                    Caminhos mais acessados agora
                                </p>
                                <div className="space-y-2">
                                    {(realtimeData?.topPages ?? report?.trafego?.realtime?.topPages ?? [])?.map((page: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between group">
                                            <span className="text-[10px] font-bold text-gray-400 truncate max-w-[200px] group-hover:text-white transition-colors">{page.path}</span>
                                            <div className="flex items-center gap-3 flex-1 px-4">
                                                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${(page.users / ((realtimeData?.topPages ?? report?.trafego?.realtime?.topPages)[0]?.users || 1)) * 100}%` }} />
                                                </div>
                                                <span className="text-[10px] font-bold text-green-500 w-4 text-right">{page.users}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {((!realtimeData?.topPages || realtimeData.topPages.length === 0) && (!report?.trafego?.realtime?.topPages || report.trafego.realtime.topPages.length === 0)) && (
                                         <p className="text-[10px] text-gray-600 font-bold italic">Sem atividade significativa no momento...</p>
                                     )}
                                </div>
                            </div>
                        </div>

                        {/* Background Decor */}
                        <div className="absolute right-[-5%] top-[-20%] opacity-5 pointer-events-none">
                            <LayoutDashboard size={300} />
                        </div>
                    </div>

                    {/* CARD: Pageviews Totais */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-6 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Eye size={20} />
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                                {report?.trafego?.views_change || "+0%"}
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Pageviews Totais</p>
                            <p className="text-2xl font-bold text-gray-900 tracking-tighter">
                                {(report?.trafego?.page_views_total || 0).toLocaleString('pt-BR')}
                            </p>
                            <p className="text-xs text-gray-400 font-medium mt-2">Visualizações no portal</p>
                        </div>
                    </div>

                    {/* CARD: Conversões (WhatsApp + Waze) */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-6 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                                <MousePointerClick size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Conversões Totais</p>
                            <p className="text-4xl font-bold text-gray-900 tracking-tighter">
                                {(report?.trafego?.conversions_total || 0).toLocaleString('pt-BR')}
                            </p>
                            <p className="text-xs text-gray-400 font-medium mt-2">Cliques em WhatsApp + Waze</p>
                        </div>
                    </div>

                    {/* CARD: Ranking de Segmentos */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-6 col-span-1 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                                <BarChart2 size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Inteligência Comercial</p>
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
                                                <span className="text-[10px] font-bold text-gray-300 w-4">{idx + 1}</span>
                                                <span className="text-xs font-bold text-gray-800">{seg.name}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400">{seg.users.toLocaleString('pt-BR')} usuários</span>
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

                    {/* CARD: Gráfico de Tráfego */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 col-span-1 md:col-span-3 lg:col-span-4">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#C00000]">
                                <LucideTrendingUp size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tráfego Histórico</p>
                                <p className="text-xs text-gray-500 font-medium">Visualizações diárias no período selecionado</p>
                            </div>
                        </div>
                        <div className="relative h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={report?.trafego?.history || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                            if (v?.length === 8) return `${v.slice(6)}/${v.slice(4, 6)}`;
                                            return v;
                                        }}
                                        minTickGap={30}
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
                                        strokeWidth={3}
                                        fill="url(#ga4TrafficGradient)"
                                        dot={false}
                                        activeDot={{ r: 6, fill: '#C00000', strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* CARD: Origem de Tráfego */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 col-span-1 md:col-span-1 lg:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Globe size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Origem de Tráfego</p>
                                <p className="text-xs text-gray-500 font-medium">Fontes principais</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {report?.trafego?.top_sources?.map((source: any, idx: number) => (
                                <div key={idx} className="flex flex-col gap-1">
                                    <div className="flex justify-between text-[11px] font-bold">
                                        <span className="text-gray-700 truncate max-w-[120px]">{source.name}</span>
                                        <span className="text-gray-400">{source.users}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-blue-500 h-full rounded-full" 
                                            style={{ width: `${Math.min((source.users / (report.trafego.top_sources[0].users || 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CARD: Dispositivos */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 col-span-1 md:col-span-1 lg:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                                <Smartphone size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Dispositivos</p>
                                <p className="text-xs text-gray-500 font-medium">Mobile vs Desktop</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {report?.trafego?.device_metrics?.map((device: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-4">
                                    {device.name.toLowerCase() === 'mobile' ? <Smartphone size={24} className="text-gray-300" /> : <Monitor size={24} className="text-gray-300" />}
                                    <div className="flex-1">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5">
                                            <span>{device.name}</span>
                                            <span className="text-gray-400">{device.users} usuários</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-purple-500 h-full rounded-full" 
                                                style={{ width: `${(device.users / report.trafego.device_metrics.reduce((acc: any, d: any) => acc + d.users, 0)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CARD: Conteúdo Top */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 col-span-1 md:col-span-1 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Top Páginas</p>
                                <p className="text-xs text-gray-500 font-medium">Conteúdos mais populares</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-gray-50">
                                    <tr>
                                        <th className="pb-3 text-[9px] font-bold uppercase tracking-widest text-gray-400">Título / URL</th>
                                        <th className="pb-3 text-right text-[9px] font-bold uppercase tracking-widest text-gray-400">Views</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {report?.trafego?.top_content?.map((page: any, idx: number) => (
                                        <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="py-2.5">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-gray-800 line-clamp-1 group-hover:text-[#C00000] transition-colors">{page.title}</span>
                                                    <span className="text-[9px] font-medium text-gray-400">{page.path}</span>
                                                </div>
                                            </td>
                                            <td className="py-2.5 text-right font-bold text-xs text-gray-600">{page.views.toLocaleString('pt-BR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
