import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios from "@/services/api";
import {
    BarChart,
    Bar,
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
    Users
} from "lucide-react";

export default function AdminReportDashboard() {
    const navigate = useNavigate();
    const { data: report, isLoading } = useQuery({
        queryKey: ["admin-report"],
        queryFn: async () => {
            const resp = await axios.get("/v1/admin/reports/dashboard");
            return resp.data;
        }
    });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    if (isLoading) {
        return <div className="p-6 bg-[#F2F2F2] min-h-screen">Carregando Dashboard Admin...</div>;
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

                {/* CARD FINANCEIRO: MRR */}
                <div className="md:col-span-4 md:row-span-2 bg-white rounded-[48px] p-12 border border-gray-100 shadow-sm flex flex-col justify-between overflow-hidden relative">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#C00000]">
                                <DollarSign size={24} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Receita Recorrente (MRR)</span>
                        </div>
                        <h2 className="text-8xl font-black text-gray-900 tracking-tighter mb-4">
                            {formatCurrency(report?.financeiro?.mrr || 0)}
                        </h2>
                        <div className="flex gap-10">
                            <div>
                                <span className="text-xs font-black text-gray-400 uppercase block mb-1">Inadimplência</span>
                                <span className="text-2xl font-black text-red-600">{report?.financeiro?.default_rate || 0}%</span>
                            </div>
                            <div>
                                <span className="text-xs font-black text-gray-400 uppercase block mb-1">Ticket Médio</span>
                                <span className="text-2xl font-black text-gray-900">{formatCurrency(report?.financeiro?.ticket_medio || 0)}</span>
                            </div>
                            <div>
                                <span className="text-xs font-black text-gray-400 uppercase block mb-1">Faturas Pendentes</span>
                                <span className="text-2xl font-black text-gray-900">{formatCurrency(report?.financeiro?.pending_invoices || 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Background Decor */}
                    <div className="absolute top-[-10%] right-[-10%] scale-150 opacity-[0.03] pointer-events-none">
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
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="text-green-500" size={18} />
                                <span className="text-xs font-bold">{report?.operacao?.quotes_total} Orçamentos Captados</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="text-blue-400" size={18} />
                                <span className="text-xs font-bold">{report?.operacao?.avg_response_minutes}m Tempo Médio Resposta</span>
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
                                    {report?.search_gaps.map((entry: any, index: number) => (
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
                                report.operacao.top_clientes.map((cli: any, idx: number) => (
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
                        className="w-full py-4 bg-black/20 hover:bg-black/30 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                        Ver Ranking Completo
                    </button>
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
