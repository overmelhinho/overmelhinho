import { useState } from 'react';
import axios from '@/services/api';
import toast from 'react-hot-toast';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { TrendingUp, Users, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { cn } from "@/lib/utils";

interface Invoice {
    id: number;
    amount: number;
    due_date: string;
    status: "paid" | "pending" | "canceled";
    client: {
        id: number;
        nome_fantasia?: string;
    };
}

interface MetricsTabProps {
    invoices: Invoice[] | undefined;
}

export default function MetricsTab({ invoices }: MetricsTabProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [chartView, setChartView] = useState<'monthly' | 'quarterly'>('monthly');

    const handleExportPdf = async () => {
        if (isExporting) return;
        setIsExporting(true);
        toast.loading("Gerando relatório executivo...", { id: "export-pdf" });

        try {
            const response = await axios.get("/v1/financial/export-pdf", {
                responseType: "blob",
            });

            // Criar link para download do blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Relatorio_Gestao_PRO_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Relatório gerado com sucesso!", { id: "export-pdf" });
        } catch (error) {
            console.error("Erro ao exportar PDF:", error);
            toast.error("Falha ao gerar o relatório PDF.", { id: "export-pdf" });
        } finally {
            setIsExporting(false);
        }
    };

    // Basic calculations
    const paidInvoices = invoices?.filter(i => i.status === 'paid') || [];
    const totalPaidRevenue = paidInvoices.reduce((acc, i) => acc + Number(i.amount), 0);
    const uniqueClients = new Set(invoices?.map(i => i.client?.id).filter(Boolean));
    const totalClientsCount = uniqueClients.size || 1; // Avoid division by zero

    // LTV (Lifetime Value) = Total Revenue / Total Unique Clients
    const realLTV = totalPaidRevenue / totalClientsCount;

    // Churn Rate Calculation (Simulated based on canceled invoices vs total in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentInvoices = invoices?.filter(i => new Date(i.due_date) > thirtyDaysAgo) || [];
    const canceledRecent = recentInvoices.filter(i => i.status === 'canceled').length;
    const totalRecent = recentInvoices.length || 1;
    const realChurnRate = (canceledRecent / totalRecent) * 100;

    // Process data for the chart (Group by month)
    const processedMonthlyData = paidInvoices.reduce((acc: any[], inv) => {
        const date = new Date(inv.due_date);
        const monthYear = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

        const existing = acc.find(item => item.name === monthYear);
        if (existing) {
            existing.total += Number(inv.amount);
            existing.timestamp = date.getTime();
        } else {
            acc.push({ name: monthYear, total: Number(inv.amount), timestamp: date.getTime() });
        }
        return acc;
    }, []).sort((a, b) => a.timestamp - b.timestamp).slice(-6);

    // Process data for the chart (Group by quarter)
    const processedQuarterlyData = paidInvoices.reduce((acc: any[], inv) => {
        const date = new Date(inv.due_date);
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const year = date.getFullYear().toString().slice(-2);
        const quarterKey = `Q${quarter}/${year}`;

        const existing = acc.find(item => item.name === quarterKey);
        if (existing) {
            existing.total += Number(inv.amount);
            existing.timestamp = date.getTime();
        } else {
            acc.push({ name: quarterKey, total: Number(inv.amount), timestamp: date.getTime() });
        }
        return acc;
    }, []).sort((a, b) => a.timestamp - b.timestamp).slice(-4);

    const chartData = chartView === 'monthly' ? processedMonthlyData : processedQuarterlyData;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Secundary Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase">LTV Real</h4>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-gray-900">
                            R$ {realLTV.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Valor médio gerado por cada cliente até hoje.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Users size={20} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase">Churn Rate</h4>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-gray-900">
                            {realChurnRate.toFixed(1)}%
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Baseado em faturas canceladas nos últimos 30 dias.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase">CAC (Estimado)</h4>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-gray-900 text-gray-400 italic">R$ ---</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Necessário configurar custos de marketing para calcular.</p>
                </div>
            </div>

            {/* Main Chart Section */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h3 className="text-xl font-black text-gray-900">Evolução de Faturamento</h3>
                        <p className="text-sm text-gray-500">Análise do crescimento de receita paga nos últimos 6 meses.</p>
                    </div>
                    <div className="flex bg-gray-50 p-1 rounded-xl">
                        <button
                            onClick={() => setChartView('monthly')}
                            className={cn(
                                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                                chartView === 'monthly'
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            Mensal
                        </button>
                        <button
                            onClick={() => setChartView('quarterly')}
                            className={cn(
                                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                                chartView === 'quarterly'
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            Trimestral
                        </button>
                    </div>
                </div>

                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#B70F0A" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#B70F0A" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                                tickFormatter={(value) => `R$ ${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                                formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Receita']}
                            />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#B70F0A"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="p-6 bg-gray-900 rounded-3xl text-white overflow-hidden relative group">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">Relatório Executivo Detalhado</h3>
                        <p className="text-gray-400 text-sm">Gere um PDF completo com todas as métricas financeiras e de crescimento para reuniões de diretoria.</p>
                    </div>
                    <button
                        onClick={handleExportPdf}
                        disabled={isExporting}
                        className="px-6 py-3 bg-white text-gray-900 rounded-2xl font-black hover:bg-gray-100 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <TrendingUp size={20} className={isExporting ? "animate-pulse" : ""} />
                        {isExporting ? "Gerando..." : "Exportar Gestão PRO"}
                    </button>
                </div>
                {/* Visual decoration */}
                <div className="absolute -right-8 -top-8 w-64 h-64 bg-red-600/20 blur-3xl rounded-full group-hover:bg-red-600/30 transition-all duration-700"></div>
            </div>
        </div>
    );
}
