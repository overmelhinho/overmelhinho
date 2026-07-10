import React, { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    Calendar,
    Mail,
    Loader2
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

interface Quote {
    id: number;
    cliente_id: number;
    customer_name: string;
    customer_whatsapp: string;
    service_requested: string;
    urgency: 'pesquisa' | 'semana' | 'emergencia';
    status: 'new' | 'replied' | 'closed';
    ai_draft_response?: string | null;
    notified_at?: string;
    created_at: string;
    cliente: {
        id: number;
        nome_fantasia: string;
        logo_url?: string | null;
        tipo_cliente?: string;
        status_assinatura?: string;
        contatos?: Array<{
            celular?: string;
            telefone_principal?: string;
            email_principal?: string;
            exibir_email?: boolean;
        }>;
    };
}

const getLogoUrl = (logoPath?: string | null) => {
    if (!logoPath) return "";
    if (logoPath.startsWith("http://") || logoPath.startsWith("https://")) {
        return logoPath;
    }
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "https://api.overmelhinho.com.br/api";
    const baseStorage = apiBase.replace(/\/api$/, "/storage").replace(/\/v1$/, "/storage").replace(/\/api\/v1$/, "/storage");
    return `${baseStorage}/${logoPath.replace(/^\//, "")}`;
};

export default function QuotesPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [period, setPeriod] = useState("all");
    const [customDates, setCustomDates] = useState({ start: "", end: "" });
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [isProspectingId, setIsProspectingId] = useState<number | null>(null);

    const updateStatusMutation = useMutation({
        mutationFn: async (quoteId: number) => {
            await axios.patch(`/v1/quotes/${quoteId}/status`, { status: "replied" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
        }
    });

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
                return <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase ring-1 ring-green-100">Enviado</span>;
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
        
        // Find phone
        const contactWithPhone = contatos.find(c => c.celular || c.telefone_principal);
        const phone = contactWithPhone ? (contactWithPhone.celular || contactWithPhone.telefone_principal || "").replace(/\D/g, "") : "";

        // Find email
        const contactWithEmail = contatos.find(c => c.email_principal && c.exibir_email);
        const email = contactWithEmail ? contactWithEmail.email_principal : "";

        if (!phone && !email) {
            toast.error(`A empresa ${lojistaNome} não possui celular ou e-mail válido cadastrado.`);
            return;
        }

        // Check lead contact type and construct direct link for merchant to reply to lead
        const isLeadEmail = quote.customer_whatsapp.includes("@");
        let directContactLink = "";
        if (isLeadEmail) {
            const subject = encodeURIComponent("Orçamento - O Vermelhinho");
            const body = encodeURIComponent(`Olá ${quote.customer_name}! Sou da ${lojistaNome}, recebemos seu contato via O Vermelhinho sobre: ${quote.service_requested}`);
            directContactLink = `mailto:${quote.customer_whatsapp}?subject=${subject}&body=${body}`;
        } else {
            const leadPhone = quote.customer_whatsapp.replace(/\D/g, "");
            const text = encodeURIComponent(`Olá ${quote.customer_name}! Sou da ${lojistaNome}, recebemos seu contato via O Vermelhinho sobre: ${quote.service_requested}`);
            directContactLink = `https://wa.me/55${leadPhone}?text=${text}`;
        }

        // Message body to send to the merchant
        const msgText = `Olá, Aqui é do O Vermelhinho e recebemos uma solicitação de orçamento/contato de um possível cliente para você. Segue abaixo:\n\n"${quote.service_requested}"\n- ${quote.customer_name}\n\nPara entrar em contato diretamente com o cliente, clique no link abaixo:\n${directContactLink}`;

        if (phone) {
            const url = `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(msgText)}`;
            window.open(url, "_blank");
            toast.success(`WhatsApp aberto para enviar à empresa ${lojistaNome}`);
            updateStatusMutation.mutate(quote.id);
        } else if (email) {
            const subject = encodeURIComponent("Novo Orçamento Recebido - O Vermelhinho");
            const body = encodeURIComponent(msgText);
            const url = `mailto:${email}?subject=${subject}&body=${body}`;
            window.open(url, "_self");
            toast.success(`E-mail aberto para enviar à empresa ${lojistaNome}`);
            updateStatusMutation.mutate(quote.id);
        }
    };

    const handleProspect = async (quote: Quote, phone: string) => {
        const cleanPhone = phone.replace(/\D/g, "");
        if (!cleanPhone) {
            toast.error("Telefone inválido.");
            return;
        }

        setIsProspectingId(quote.id);
        const toastId = toast.loading("Gerando mensagem de prospecção com IA...");
        
        // Abre a aba antes do await para evitar bloqueador de pop-ups do navegador
        const newWindow = window.open('about:blank', '_blank');

        try {
            const res = await axios.post(`/v1/quotes/${quote.id}/prospect-message`);
            const message = res.data.message;

            toast.success("Mensagem gerada! Abrindo WhatsApp...", { id: toastId });
            
            const url = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(message)}`;
            if (newWindow) {
                newWindow.location.href = url;
            } else {
                window.location.href = url; // Fallback se o navegador ainda assim bloquear
            }
            
            updateStatusMutation.mutate(quote.id);
        } catch (error) {
            console.error("Erro ao gerar prospecção", error);
            if (newWindow) newWindow.close();
            toast.error("Falha ao gerar mensagem com a IA.", { id: toastId });
        } finally {
            setIsProspectingId(null);
        }
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
                                {s === '' ? 'Todos' : s === 'new' ? 'Pendentes' : 'Enviados'}
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
                                            <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100 group-hover:bg-red-50 group-hover:text-[#C00000] transition-colors overflow-hidden">
                                                {quote.cliente.logo_url ? (
                                                    <img 
                                                        src={getLogoUrl(quote.cliente.logo_url)} 
                                                        alt={quote.cliente.nome_fantasia}
                                                        className="w-full h-full object-contain p-1"
                                                    />
                                                ) : (
                                                    <Briefcase size={20} />
                                                )}
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
                                            <div 
                                                className="cursor-pointer group/msg mt-1 inline-block" 
                                                onClick={() => setSelectedQuote(quote)}
                                                title="Clique para ler a mensagem completa"
                                            >
                                                <span className="text-xs text-gray-500 line-clamp-1 font-medium group-hover/msg:text-gray-900 transition-colors border-b border-dashed border-transparent group-hover/msg:border-gray-300">
                                                    {quote.service_requested}
                                                </span>
                                            </div>
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
                                         {quote.status === 'new' || quote.status === 'replied' ? (
                                            (() => {
                                                const isPagante = ['pagante', 'anunciante'].includes(quote.cliente.tipo_cliente || '') && ['ativa', 'ativo', 'inadimplente'].includes(quote.cliente.status_assinatura || '');

                                                if (!isPagante) {
                                                    const contatos = quote.cliente.contatos || [];
                                                    const availablePhones = contatos.flatMap(c => {
                                                        const p = [];
                                                        if (c.telefone_principal) p.push({ label: 'Principal', number: c.telefone_principal });
                                                        if (c.celular) p.push({ label: 'Celular', number: c.celular });
                                                        if (c.telefone_secundario) p.push({ label: 'Secundário', number: c.telefone_secundario });
                                                        if (c.outro_telefone) p.push({ label: 'Outro', number: c.outro_telefone });
                                                        return p;
                                                    }).filter(p => p.number);

                                                    if (availablePhones.length > 0) {
                                                        return (
                                                            <div className="flex flex-col items-center gap-2">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <button 
                                                                            disabled={isProspectingId === quote.id}
                                                                            className="h-12 px-6 rounded-[20px] text-[10px] font-black uppercase transition-all flex items-center gap-2 mx-auto active:scale-95 shadow-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 disabled:opacity-70"
                                                                        >
                                                                            {isProspectingId === quote.id ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
                                                                            Prospectar Cliente
                                                                        </button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="center" className="w-64 rounded-3xl p-3 bg-white border border-gray-100 shadow-2xl">
                                                                        <div className="px-3 py-2 mb-2 border-b border-gray-50">
                                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Selecione o número</span>
                                                                            <span className="text-xs font-bold text-gray-900">Iniciar Prospecção IA</span>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            {availablePhones.map((phone, idx) => (
                                                                                <DropdownMenuItem 
                                                                                    key={idx} 
                                                                                    className="text-xs font-bold cursor-pointer rounded-2xl flex flex-col items-start gap-0.5 p-3 hover:bg-indigo-50 focus:bg-indigo-50 text-gray-700 focus:text-indigo-700 transition-colors"
                                                                                    onClick={() => handleProspect(quote, phone.number)}
                                                                                >
                                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 mb-1">{phone.label}</span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Smartphone size={14} className="text-indigo-400" />
                                                                                        {phone.number}
                                                                                    </div>
                                                                                </DropdownMenuItem>
                                                                            ))}
                                                                        </div>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                                <span className="text-[9px] font-black uppercase tracking-tighter text-gray-400 flex items-center gap-1 mt-1 opacity-70" title="A lead original foi enviada para o e-mail do cliente (Plano Gratuito)"><Mail size={10} /> Auto-Notificado E-mail</span>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="flex flex-col items-center gap-1 opacity-50">
                                                            <CheckCircle2 size={16} className="text-gray-400" />
                                                            <span className="text-[8px] font-black uppercase tracking-tighter text-gray-500">Envio Automático</span>
                                                            <span className="text-[8px] font-black uppercase tracking-tighter text-red-400 mt-1">Sem telefone</span>
                                                        </div>
                                                    );
                                                }

                                                const contatos = quote.cliente.contatos || [];
                                                const contactWithPhone = contatos.find(c => c.celular || c.telefone_principal);
                                                const phone = contactWithPhone ? (contactWithPhone.celular || contactWithPhone.telefone_principal || "").replace(/\D/g, "") : "";

                                                if (phone) {
                                                    return (
                                                        <button
                                                            onClick={() => notifyLojista(quote)}
                                                            className="h-12 px-6 rounded-[20px] text-[10px] font-black uppercase transition-all flex items-center gap-2 mx-auto active:scale-95 shadow-lg bg-[#C00000] text-white hover:bg-black shadow-red-100"
                                                        >
                                                            <Smartphone size={16} />
                                                            Enviar para Empresa
                                                        </button>
                                                    );
                                                }

                                                return (
                                                    <div className="flex flex-col items-center gap-1 opacity-30">
                                                        <AlertTriangle size={16} className="text-gray-400" />
                                                        <span className="text-[8px] font-black uppercase tracking-tighter">Sem WhatsApp</span>
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

            {/* Modal de Detalhes da Mensagem */}
            {selectedQuote && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedQuote(null)}>
                    <div 
                        className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Detalhes da Solicitação</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1">Enviado por <strong className="text-gray-900">{selectedQuote.customer_name}</strong> • {selectedQuote.customer_whatsapp}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedQuote(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Mensagem do Cliente</label>
                                <div className="p-4 bg-gray-50 rounded-[20px] text-sm text-gray-700 font-medium whitespace-pre-wrap border border-gray-100">
                                    {selectedQuote.service_requested}
                                </div>
                            </div>
                            
                            {selectedQuote.ai_draft_response && (
                                <div className="mb-6">
                                    <label className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                        🤖 Sugestão da IA
                                    </label>
                                    <div className="p-4 bg-red-50/50 rounded-[20px] text-sm text-gray-700 font-medium whitespace-pre-wrap border border-red-100 italic">
                                        "{selectedQuote.ai_draft_response}"
                                    </div>
                                </div>
                            )}

                            {selectedQuote.notified_at && (
                                <div>
                                    <label className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Status de Notificação
                                    </label>
                                    <p className="text-xs text-gray-500">
                                        E-mail automático disparado para a empresa em <strong className="text-gray-900">{format(new Date(selectedQuote.notified_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}</strong>.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                            <button 
                                onClick={() => setSelectedQuote(null)}
                                className="px-8 py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-colors shadow-xl shadow-gray-200"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
