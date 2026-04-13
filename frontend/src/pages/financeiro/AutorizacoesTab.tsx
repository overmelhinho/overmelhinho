import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "@/services/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    FileText,
    Plus,
    Search,
    Download,
    Send,
    Trash2,
    Calendar,
    ChevronRight,
    ExternalLink,
    CheckCircle,
    Clock,
    XCircle,
    MoreHorizontal,
    Share2,
    DollarSign,
    Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";
import CreateAutorizacaoModal from "./components/CreateAutorizacaoModal";
import PreviewAutorizacaoModal from "./components/PreviewAutorizacaoModal";
import { cn } from "@/lib/utils";

interface Autorizacao {
    id: number;
    numero: number;
    cliente: {
        id: number;
        nome_fantasia: string;
        cpf_cnpj: string;
    };
    vendedor: {
        id: number;
        name: string;
    } | null;
    titulo_anuncio: string;
    valor_total: number;
    status: "rascunho" | "aguardando_assinatura" | "assinado" | "cancelado";
    data_inicio: string;
    data_fim: string;
    assinado_em: string | null;
    pdf_path: string | null;
}

export default function AutorizacoesTab() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [selectedPreview, setSelectedPreview] = useState<{ id: number, numero: number } | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    
    // Limpa seleção ao trocar filtros
    useEffect(() => {
        setSelectedIds([]);
    }, [statusFilter, searchTerm, dateStart, dateEnd]);

    const { data: autorizacoes, isLoading, refetch } = useQuery({
        queryKey: ["autorizacoes", statusFilter, searchTerm, dateStart, dateEnd],
        queryFn: async () => {
            const params: any = {};
            if (statusFilter !== "all") params.status = statusFilter;
            if (searchTerm) params.q = searchTerm;
            if (dateStart) params.date_start = dateStart;
            if (dateEnd) params.date_end = dateEnd;
            
            const response = await axios.get("/v1/autorizacoes", { params });
            return response.data.data as Autorizacao[];
        }
    });

    const filtered = autorizacoes || [];

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (!filtered) return;
        if (selectedIds.length === filtered.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filtered.map(a => a.id));
        }
    };

    const handleDownloadBatch = async () => {
        if (selectedIds.length === 0) {
            toast.error("Selecione ao menos um contrato.");
            return;
        }

        const loadingToast = toast.loading(`Preparando ${selectedIds.length} contratos...`);
        try {
            const response = await axios.post('/v1/autorizacoes/download-batch', 
                { ids: selectedIds },
                { responseType: 'blob' }
            );

            const blob = new Blob([response.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.download = `contratos_lote_${format(new Date(), 'yyyyMMdd_HHmm')}.zip`;
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            toast.success("Download concluído!", { id: loadingToast });
        } catch (error) {
            toast.error("Erro ao gerar arquivo ZIP.", { id: loadingToast });
        }
    };

    const handleSendLink = async (id: number) => {
        try {
            const response = await axios.post(`/v1/autorizacoes/${id}/send-link`);
            toast.success("Link gerado e pronto para envio!");

            // Tenta copiar para o clipboard se o link vier na resposta
            if (response.data.link) {
                navigator.clipboard.writeText(response.data.link);
                toast.success("Link copiado para o clipboard!", { icon: "📋" });

                // Abre o zap se tiver contato (simplificando aqui, o ideal é ter o n do zap)
                // window.open(`https://wa.me/?text=${encodeURIComponent("Olá, aqui está o seu contrato para assinatura: " + response.data.link)}`);
            }
            refetch();
        } catch (error) {
            toast.error("Erro ao gerar link de assinatura.");
        }
    };

    const handleGenerateInvoices = async (id: number) => {
        const loadingToast = toast.loading("Comunicando com Tiny ERP e gerando faturas...");
        try {
            const response = await axios.post(`/v1/autorizacoes/${id}/generate-invoices`);
            toast.success(`${response.data.invoices_criadas} faturas geradas e enviadas ao Tiny!`, { id: loadingToast });
            refetch();
        } catch (error: any) {
            const msg = error.response?.data?.message || "Erro ao gerar faturas.";
            toast.error(msg, { id: loadingToast },);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "assinado":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                        <CheckCircle size={12} /> Assinado
                    </span>
                );
            case "aguardando_assinatura":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-700 animate-pulse">
                        <Clock size={12} /> Aguardando
                    </span>
                );
            case "cancelado":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700">
                        <XCircle size={12} /> Cancelado
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                        <FileText size={12} /> Rascunho
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar contrato ou cliente..."
                            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        {['all', 'rascunho', 'aguardando_assinatura', 'assinado'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all",
                                    statusFilter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {s === 'all' ? 'Ver Todos' : s === 'aguardando_assinatura' ? 'Aguardando' : s}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                            <Calendar size={14} className="text-gray-400" />
                            <input
                                type="date"
                                value={dateStart}
                                onChange={(e) => setDateStart(e.target.value)}
                                className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-gray-600 cursor-pointer"
                                title="Data inicial"
                            />
                            <span className="text-gray-300 text-[10px]">até</span>
                            <input
                                type="date"
                                value={dateEnd}
                                onChange={(e) => setDateEnd(e.target.value)}
                                className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-gray-600 cursor-pointer"
                                title="Data final"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <Button
                            onClick={handleDownloadBatch}
                            variant="outline"
                            className="bg-white border-red-200 text-red-600 font-black rounded-xl gap-2 h-11 px-6 hover:bg-red-50"
                        >
                            <Download size={20} />
                            Baixar Selecionados ({selectedIds.length})
                        </Button>
                    )}
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-600/20 gap-2 h-11 px-6 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        Novo Contrato (Autorização)
                    </Button>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-bottom border-gray-100">
                             <th className="px-6 py-4 w-10">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                    checked={filtered?.length > 0 && selectedIds.length === filtered?.length}
                                    onChange={toggleSelectAll}
                                />
                             </th>
                             <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Contrato / Cliente</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Publicidade</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Investimento</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Vigência</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={6} className="px-6 py-4"><div className="h-10 bg-gray-50 rounded-xl" /></td>
                                </tr>
                            ))
                        ) : filtered?.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium italic">
                                    Nenhuma autorização de faturamento encontrada.
                                </td>
                            </tr>
                        ) : (
                            filtered?.map((a) => (
                                <tr key={a.id} className={cn("hover:bg-gray-50/50 transition-colors group", selectedIds.includes(a.id) && "bg-red-50/30")}>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                            checked={selectedIds.includes(a.id)}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                toggleSelect(a.id);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </td>
                                    <td className="px-6 py-4" onClick={() => toggleSelect(a.id)}>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-gray-900 group-hover:text-red-600 transition-colors">
                                                #{a.numero.toString().padStart(5, '0')}
                                            </span>
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">
                                                {a.cliente.nome_fantasia}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                                            {a.titulo_anuncio}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-black text-gray-900 tracking-tight">
                                            R$ {Number(a.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                            <Calendar size={14} />
                                            {format(new Date(a.data_inicio), "dd/MM/yy")} <ChevronRight size={10} /> {format(new Date(a.data_fim), "dd/MM/yy")}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(a.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900 rounded-xl">
                                                    <MoreHorizontal size={20} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-xl border-gray-100">
                                                <DropdownMenuLabel className="text-[10px] uppercase font-black text-gray-400 px-3 tracking-widest py-2">Gestão de Contrato</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedPreview({ id: a.id, numero: a.numero });
                                                        setIsPreviewOpen(true);
                                                    }}
                                                    className="rounded-xl font-bold text-xs gap-2 py-2.5 cursor-pointer"
                                                >
                                                    <FileText size={16} /> Visualizar PDF (Contrato)
                                                </DropdownMenuItem>

                                                {a.status === "rascunho" && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleSendLink(a.id)}
                                                        className="rounded-xl font-bold text-xs gap-2 py-2.5 text-blue-600 bg-blue-50/50 hover:bg-blue-50 cursor-pointer"
                                                    >
                                                        <Share2 size={16} /> Enviar p/ Assinatura Digital
                                                    </DropdownMenuItem>
                                                )}

                                                {a.status === "aguardando_assinatura" && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleSendLink(a.id)}
                                                        className="rounded-xl font-bold text-xs gap-2 py-2.5 text-yellow-600 bg-yellow-50 cursor-pointer"
                                                    >
                                                        <LinkIcon size={16} /> Copiar Link p/ Envio Manual
                                                    </DropdownMenuItem>
                                                )}

                                                {a.status === "assinado" && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleGenerateInvoices(a.id)}
                                                        className="rounded-xl font-bold text-xs gap-2 py-2.5 text-emerald-600 bg-emerald-50 cursor-pointer"
                                                    >
                                                        <DollarSign size={16} /> Gerar Faturas no Tiny ERP
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuSeparator className="bg-gray-50" />
                                                <DropdownMenuItem className="rounded-xl font-bold text-xs gap-2 py-2.5 text-red-600 hover:bg-red-50 cursor-pointer">
                                                    <Trash2 size={16} /> Cancelar Autorização
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <CreateAutorizacaoModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    refetch();
                }}
            />

            <PreviewAutorizacaoModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                autorizacaoId={selectedPreview?.id || null}
                numero={selectedPreview?.numero || null}
            />
        </div>
    );
}
