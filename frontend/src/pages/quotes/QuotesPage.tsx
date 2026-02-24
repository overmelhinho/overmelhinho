import React, { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import axios from "@/services/api";
import {
    MessageCircle,
    Smartphone,
    Clock,
    AlertTriangle,
    CheckCircle2,
    User,
    Search,
    Filter,
    Briefcase,
    TrendingUp,
    Timer,
    Zap,
    Calendar
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";

interface Quote {
    id: number;
    cliente_id: number;
    customer_name: string;
    customer_whatsapp: string;
    service_requested: string;
    urgency: 'pesquisa' | 'semana' | 'emergencia';
    status: 'new' | 'replied' | 'closed';
    notified_at?: string;
    created_at: string;
    cliente: {
        id: number;
        nome_fantasia: string;
        contatos?: Array<{
            celular?: string;
            telefone_principal?: string;
        }>;
    };
}

export default function QuotesPage() {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [period, setPeriod] = useState("all");
    const [customDates, setCustomDates] = useState({ start: "", end: "" });

    const { data: responseData, isLoading } = useQuery({
        queryKey: ["admin-quotes", page, statusFilter, period, customDates],
        queryFn: async () => {
            const params: any = { page };
            if (statusFilter) params.status = statusFilter;

            if (period !== "all" && period !== "custom") {
                params.period = period;
            } else if (period === "custom" && customDates.start && customDates.end) {
                params.start_date = customDates.start;
                params.end_date = customDates.end;
            }

            const resp = await axios.get("/v1/quotes", { params });
            return resp.data;
        }
    });

    const quotes = responseData?.quotes?.data || [];
    const stats = responseData?.stats || {
        total_pending: 0,
        emergency_pending: 0,
        avg_wait_time_mins: 0,
        conversion_rate: 0
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "new":
                return <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase ring-1 ring-blue-100">Novo</span>;
            case "replied":
                return <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase ring-1 ring-green-100">Respondido</span>;
            case "closed":
                return <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-[10px] font-black uppercase ring-1 ring-gray-100">Fechado</span>;
            default:
                return null;
        }
    };

    const getUrgencyBadge = (urgency: string) => {
        switch (urgency) {
            case "emergencia":
                return <span className="flex items-center gap-1.5 text-red-600 font-bold"><AlertTriangle size={14} /> Emergência</span>;
            case "semana":
                return <span className="flex items-center gap-1.5 text-orange-500 font-bold"><Clock size={14} /> Esta Semana</span>;
            default:
                return <span className="flex items-center gap-1.5 text-blue-500 font-bold"><MessageCircle size={14} /> Pesquisa</span>;
        }
    };

    const notifyLojista = (quote: Quote) => {
        const lojistaNome = quote.cliente.nome_fantasia;
        const contatos = quote.cliente.contatos || [];
        const contatoPrincipal = contatos[0]?.celular || contatos[0]?.telefone_principal || "";
        const fone = contatoPrincipal.replace(/\D/g, "");

        if (!fone) {
            toast.error(`O lojista ${lojistaNome} não possui celular cadastrado.`);
            return;
        }

        const msg = `Olá ${lojistaNome}, notamos que o orçamento de ${quote.customer_name} (${quote.urgency}) ainda não foi respondido no painel do O Vermelhinho. Por favor, verifique sua Fila de Foco para não perder o lead!`;
        const url = `https://wa.me/55${fone}?text=${encodeURIComponent(msg)}`;

        window.open(url, "_blank");
        toast.success(`WhatsApp aberto para cobrar ${lojistaNome}`);
    };

    return (
        <DashboardLayout>
            {/* Título e Filtros */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Gestão de Orçamentos</h1>
                    <p className="text-gray-500 font-medium text-lg">Monitoramento de agilidade e conversão da rede.</p>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                    {/* Filtro Status */}
                    <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                        {['', 'new', 'replied'].map((s) => (
                            <button
                                key={s}
                                onClick={() => {
                                    setStatusFilter(s);
                                    setPage(1);
                                }}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s
                                    ? 'bg-gray-900 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {s === '' ? 'Todos' : s === 'new' ? 'Pendentes' : 'Respondidos'}
                            </button>
                        ))}
                    </div>

                    {/* Filtro Período */}
                    <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                        {[
                            { id: 'all', label: 'Sempre' },
                            { id: '24h', label: '24h' },
                            { id: '7d', label: '7d' },
                            { id: 'custom', label: 'Custom' }
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    setPeriod(p.id);
                                    setPage(1);
                                }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p.id
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Calendários (se custom) */}
                    {period === 'custom' && (
                        <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
                            <input
                                type="date"
                                value={customDates.start}
                                onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })}
                                className="p-2 border border-gray-100 rounded-xl text-[10px] font-bold outline-none focus:border-red-500"
                            />
                            <span className="text-gray-400 font-bold">~</span>
                            <input
                                type="date"
                                value={customDates.end}
                                onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })}
                                className="p-2 border border-gray-100 rounded-xl text-[10px] font-bold outline-none focus:border-red-500"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* KPIs da Página */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Zap size={20} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aguardando</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-black text-gray-900">{stats.total_pending}</h3>
                        <span className="text-xs font-bold text-gray-500 mb-1">Orçamentos</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                            <AlertTriangle size={20} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Emergências</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-black text-red-600">{stats.emergency_pending}</h3>
                        <span className="text-xs font-bold text-gray-500 mb-1">Críticos</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                            <Timer size={20} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Espera Média</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-black text-gray-900">{stats.avg_wait_time_mins}</h3>
                        <span className="text-xs font-bold text-gray-500 mb-1">Minutos</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conversão</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-black text-gray-900">{stats.conversion_rate}%</h3>
                        <span className="text-xs font-bold text-gray-500 mb-1">Eficiência</span>
                    </div>
                </div>
            </div>

            {/* Tabela de Gestão */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(n => <div key={n} className="h-20 bg-gray-100 animate-pulse rounded-[28px]" />)}
                </div>
            ) : (
                <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tempo de Espera</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Loja e Notificação</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Solicitante</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Urgência</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {quotes.length > 0 ? quotes.map((quote: Quote) => (
                                <tr key={quote.id} className="hover:bg-gray-50/30 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className={`text-base font-black ${quote.status === 'new' ? 'text-red-600 animate-pulse' : 'text-gray-400'}`}>
                                                {formatDistanceToNow(new Date(quote.created_at), { locale: ptBR, addSuffix: true })}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                {format(new Date(quote.created_at), "dd/MM/yy - HH:mm")}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100 group-hover:bg-red-50 group-hover:text-[#C00000] transition-colors">
                                                <Briefcase size={20} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900">{quote.cliente.nome_fantasia}</span>
                                                {quote.notified_at ? (
                                                    <span className="flex items-center gap-1 text-[9px] text-green-600 font-black uppercase tracking-tighter mt-0.5" title={`Notificado automaticamente em: ${format(new Date(quote.notified_at), "dd/MM HH:mm")}`}>
                                                        <CheckCircle2 size={10} /> Auto-Notificado
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1 opacity-50">Não notificado</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-gray-400" />
                                                <span className="text-sm font-bold text-gray-900">{quote.customer_name}</span>
                                            </div>
                                            <span className="text-xs text-gray-500 line-clamp-1 mt-1 font-medium">{quote.service_requested}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-xs">
                                            {getUrgencyBadge(quote.urgency)}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {getStatusBadge(quote.status)}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        {quote.status === 'new' ? (
                                            (() => {
                                                const fone = (quote.cliente.contatos?.[0]?.celular || quote.cliente.contatos?.[0]?.telefone_principal || "").replace(/\D/g, "");

                                                if (fone) {
                                                    const alreadyNotified = !!quote.notified_at;
                                                    return (
                                                        <button
                                                            onClick={() => notifyLojista(quote)}
                                                            className={`h-12 px-6 rounded-[20px] text-[10px] font-black uppercase transition-all flex items-center gap-2 mx-auto active:scale-95 shadow-lg ${alreadyNotified
                                                                ? 'bg-white border-2 border-gray-100 text-gray-500 hover:bg-gray-50'
                                                                : 'bg-[#C00000] text-white hover:bg-black shadow-red-100'
                                                                }`}
                                                        >
                                                            <Smartphone size={16} />
                                                            {alreadyNotified ? 'Cobrar Manualmente' : 'Cobrar Lojista'}
                                                        </button>
                                                    );
                                                }

                                                return (
                                                    <div className="flex flex-col items-center gap-1 opacity-30">
                                                        <Smartphone size={16} className="text-gray-400" />
                                                        <span className="text-[8px] font-black uppercase tracking-tighter">Sem Telefone</span>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <div className="flex items-center justify-center gap-2 text-green-500 font-black text-[10px] uppercase">
                                                <CheckCircle2 size={16} />
                                                Finalizado
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <Briefcase size={40} className="opacity-20" />
                                            <span className="text-sm font-bold uppercase tracking-widest">Nenhum orçamento encontrado</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Paginação */}
                    {responseData?.quotes?.last_page > 1 && (
                        <div className="p-10 border-t border-gray-50 flex justify-center gap-2">
                            {Array.from({ length: responseData.quotes.last_page }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${p === page
                                        ? "bg-gray-900 text-white shadow-xl scale-110"
                                        : "bg-white border border-gray-100 text-gray-400 hover:bg-gray-50"
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </DashboardLayout>
    );
}
