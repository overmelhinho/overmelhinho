import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "@/services/api";
import {
    Eye, MessageCircle, MapPin, Ticket,
    ChevronRight, X, Settings, Building2,
    TrendingUp, AlertCircle, CheckCircle2, Clock
} from "lucide-react";

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const SkeletonBlock = ({ className = "" }: { className?: string }) => (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse ${className}`}>
        <div className="p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100" />
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
        </div>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { label: string; style: string }> = {
        ativo: { label: "Ativo", style: "bg-emerald-50 text-emerald-700 border-emerald-100" },
        inativo: { label: "Inativo", style: "bg-gray-100 text-gray-500 border-gray-200" },
        suspenso: { label: "Suspenso", style: "bg-amber-50 text-amber-700 border-amber-100" },
        trial: { label: "Trial", style: "bg-blue-50 text-blue-700 border-blue-100" },
    };
    const cfg = map[status?.toLowerCase()] ?? map.inativo;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${cfg.style}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {cfg.label}
        </span>
    );
};

const TicketStatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
        open: "bg-red-50 text-red-600",
        pending: "bg-amber-50 text-amber-600",
        resolved: "bg-emerald-50 text-emerald-600",
    };
    const labels: Record<string, string> = {
        open: "Aberto", pending: "Pendente", resolved: "Resolvido"
    };
    return (
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
            {labels[status] ?? status}
        </span>
    );
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function ClientHubPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isEditOpen, setIsEditOpen] = useState(false);

    // ── Query: Dados do cliente ──────────────────────────────────────────────
    const { data: cliente, isLoading: loadingCliente } = useQuery({
        queryKey: ["cliente-hub", id],
        queryFn: async () => {
            const res = await axios.get(`/v1/clientes/${id}`);
            // A API retorna { data: {...} } ou direto o objeto
            return res.data?.data ?? res.data;
        },
        enabled: !!id,
    });

    // ── Query: Dashboard de Performance (GA4 + DB) ───────────────────────────
    const { data: report, isLoading: loadingReport } = useQuery({
        queryKey: ["client-report-hub", id],
        queryFn: async () => {
            const res = await axios.get(`/v1/clients/${id}/reports/dashboard`);
            return res.data;
        },
        enabled: !!id,
        refetchInterval: 5 * 60 * 1000,
    });

    // ── Query: Tickets do cliente ────────────────────────────────────────────
    const { data: ticketsData } = useQuery({
        queryKey: ["tickets-cliente", id],
        queryFn: async () => {
            const res = await axios.get(`/v1/tickets?cliente_id=${id}&limit=5`);
            return res.data;
        },
        enabled: !!id,
    });

    const tickets: any[] = ticketsData?.data ?? ticketsData ?? [];

    if (loadingCliente) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <SkeletonBlock />
                <SkeletonBlock className="md:col-span-2" />
                <SkeletonBlock />
                <SkeletonBlock className="md:col-span-4" />
            </div>
        );
    }

    const plano = cliente?.plan;
    const ga4Status = report?.visibilidade?.ga4_status === 'active';

    return (
        <>
            {/* ── SLIDE-OVER: Edição ─────────────────────────────────────── */}
            {/* Backdrop */}
            <div
                onClick={() => setIsEditOpen(false)}
                className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isEditOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            />
            {/* Drawer */}
            <aside className={`fixed top-0 right-0 z-50 h-full w-full md:w-[48%] lg:w-[42%] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isEditOpen ? "translate-x-0" : "translate-x-full"}`}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight">Editar Cadastro</h2>
                        <p className="text-xs text-gray-400 font-medium">{cliente?.nome_fantasia}</p>
                    </div>
                    <button
                        onClick={() => setIsEditOpen(false)}
                        className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all active:scale-90"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {/* ↓ placeholder para integração do formulário completo */}
                    <div className="h-full flex items-center justify-center text-center">
                        <div>
                            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Settings size={28} className="text-[#C00000]" />
                            </div>
                            <p className="text-sm font-black text-gray-700">ClientForm Component</p>
                            <p className="text-xs text-gray-400 mt-1">Integre o formulário de edição aqui</p>
                            <button
                                onClick={() => navigate(`/clientes/${id}/editar`)}
                                className="mt-6 px-5 py-2.5 bg-[#C00000] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-700 active:scale-95 transition-all"
                            >
                                Abrir Página de Edição Completa →
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── LAYOUT PRINCIPAL ───────────────────────────────────────── */}
            <div className="p-6 bg-gray-50 min-h-screen">

                {/* Header */}
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Hub do Cliente</p>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tighter">
                            {cliente?.nome_fantasia ?? "Carregando..."}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {ga4Status && (
                            <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">GA4 Ativo</span>
                            </div>
                        )}
                        <button
                            onClick={() => navigate(`/clientes/${id}/editar`)}
                            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                        >
                            Ver Todos os Dados →
                        </button>
                    </div>
                </header>

                {/* BENTO GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

                    {/* ── BLOCO 1: Perfil e Status ──────────────────────── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-8 flex flex-col justify-between gap-6">
                        <div className="flex flex-col items-center text-center gap-4">
                            {/* Logo / Avatar */}
                            <div className="relative">
                                {cliente?.logo_url ? (
                                    <img
                                        src={cliente.logo_url}
                                        alt={cliente.nome_fantasia}
                                        className="w-20 h-20 rounded-2xl object-cover border border-gray-100 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center text-[#C00000]">
                                        <Building2 size={32} />
                                    </div>
                                )}
                                <div className="absolute -bottom-2 -right-2">
                                    <StatusBadge status={cliente?.status_assinatura ?? "inativo"} />
                                </div>
                            </div>

                            {/* Nome + ID */}
                            <div className="mt-2">
                                <h2 className="text-base font-black text-gray-900 tracking-tight leading-tight">
                                    {cliente?.nome_fantasia}
                                </h2>
                                <p className="text-xs text-gray-400 font-medium mt-0.5">ID #{id}</p>
                            </div>
                        </div>

                        {/* Plano */}
                        {plano && (
                            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Plano Ativo</p>
                                <p className="text-sm font-black text-gray-900">{plano.name}</p>
                                <p className="text-xs text-[#C00000] font-bold">
                                    R$ {Number(plano.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                                </p>
                            </div>
                        )}

                        {/* Ação */}
                        <button
                            onClick={() => setIsEditOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-black uppercase tracking-widest hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all"
                        >
                            <Settings size={14} />
                            Editar Cadastro
                        </button>
                    </div>

                    {/* ── BLOCO 2: Performance GA4 ──────────────────────── */}
                    <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <TrendingUp size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Performance GA4</p>
                                    <p className="text-xs text-gray-400">Últimos 30 dias</p>
                                </div>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${ga4Status ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 text-gray-400 border-gray-100"}`}>
                                {ga4Status ? "Dados GA4" : "Dados Locais"}
                            </span>
                        </div>

                        {loadingReport ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-16 bg-gray-100 rounded-xl" />
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="h-20 bg-gray-100 rounded-xl" />
                                    <div className="h-20 bg-gray-100 rounded-xl" />
                                    <div className="h-20 bg-gray-100 rounded-xl" />
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Visualizações Hero */}
                                <div className="mb-6">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Visualizações do Perfil</p>
                                    <div className="flex items-end gap-3">
                                        <p className="text-6xl font-black text-gray-900 tracking-tighter leading-none">
                                            {(report?.visibilidade?.total_views ?? 0).toLocaleString('pt-BR')}
                                        </p>
                                        <div className="mb-1">
                                            <Eye size={20} className="text-blue-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* KPIs de Conversão */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex flex-col items-center text-center">
                                        <MessageCircle size={20} className="text-green-600 mb-2" />
                                        <p className="text-2xl font-black text-gray-900">{report?.visibilidade?.whatsapp ?? 0}</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-green-600 mt-0.5">WhatsApp</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col items-center text-center">
                                        <MapPin size={20} className="text-blue-600 mb-2" />
                                        <p className="text-2xl font-black text-gray-900">{report?.visibilidade?.waze ?? 0}</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-600 mt-0.5">Mapa/Waze</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 flex flex-col items-center text-center">
                                        <TrendingUp size={20} className="text-purple-600 mb-2" />
                                        <p className="text-2xl font-black text-gray-900">{report?.visibilidade?.social ?? 0}</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-purple-600 mt-0.5">Redes Sociais</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── BLOCO 3: Tickets do Cliente ───────────────────── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-8 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                                    <Ticket size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tickets</p>
                                    <p className="text-xs text-gray-400">Em aberto</p>
                                </div>
                            </div>
                            {tickets.length > 0 && (
                                <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-[10px] font-black flex items-center justify-center">
                                    {tickets.length}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 space-y-3">
                            {tickets.length > 0 ? (
                                tickets.slice(0, 5).map((ticket: any) => (
                                    <button
                                        key={ticket.id}
                                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                                        className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all group border border-transparent hover:border-gray-100"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-gray-800 truncate">{ticket.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <TicketStatusBadge status={ticket.status} />
                                                <span className="text-[9px] text-gray-300 font-medium">
                                                    {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('pt-BR') : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-600 flex-shrink-0 transition-colors" />
                                    </button>
                                ))
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                                    <CheckCircle2 size={28} className="text-gray-200 mb-2" />
                                    <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Sem tickets abertos</p>
                                </div>
                            )}
                        </div>

                        {tickets.length > 0 && (
                            <button
                                onClick={() => navigate(`/tickets?cliente_id=${id}`)}
                                className="mt-4 w-full py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#C00000] transition-colors"
                            >
                                Ver todos os tickets →
                            </button>
                        )}
                    </div>

                    {/* ── BLOCO 4: Quick Stats (full width) ─────────────── */}
                    <div className="col-span-1 md:col-span-3 lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Resumo Geral · Acesso Rápido</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button
                                onClick={() => navigate(`/vagas?cliente_id=${id}`)}
                                className="flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-100 hover:border-[#C00000]/30 hover:bg-red-50/50 active:scale-95 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#C00000] group-hover:scale-110 transition-transform">
                                    <Ticket size={20} />
                                </div>
                                <span className="text-xs font-black text-gray-600 group-hover:text-[#C00000]">Vagas PRO</span>
                            </button>

                            <button
                                onClick={() => navigate(`/campanhas?cliente_id=${id}`)}
                                className="flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 active:scale-95 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                    <TrendingUp size={20} />
                                </div>
                                <span className="text-xs font-black text-gray-600 group-hover:text-purple-600">Campanhas</span>
                            </button>

                            <button
                                onClick={() => navigate(`/clientes/${id}/performance`)}
                                className="flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 active:scale-95 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                    <Eye size={20} />
                                </div>
                                <span className="text-xs font-black text-gray-600 group-hover:text-blue-600">Performance</span>
                            </button>

                            <button
                                onClick={() => navigate(`/clientes/${id}/editar`)}
                                className="flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 active:scale-95 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                    <Settings size={20} />
                                </div>
                                <span className="text-xs font-black text-gray-600 group-hover:text-emerald-600">Editar Dados</span>
                            </button>
                        </div>
                    </div>


                </div>
            </div>
        </>
    );
}
