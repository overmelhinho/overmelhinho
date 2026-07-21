import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "@/services/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
    DollarSign,
    AlertCircle,
    CheckCircle2,
    Clock,
    Calendar,
    Search,
    Download,
    ExternalLink,
    Trash2,
    Check,
    Send,
    Copy,
    MessageCircle,
    X,
    Phone,
    Mail,
    User,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Pencil,
    Landmark,
    Info,
    Printer,
    Filter,
    Smartphone,
    CreditCard,
    Barcode,
} from "lucide-react";
import { format, isBefore, startOfDay, subDays, isAfter, startOfMonth, endOfMonth, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Textarea from "@/components/ui/textarea";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { useCidades } from "@/hooks/useCidades";

interface Invoice {
    id: number;
    amount: number;
    due_date: string;
    status: "pending" | "paid" | "canceled";
    payment_url: string | null;
    created_at: string;
    is_permuta?: boolean;
    permuta_amount?: number;
    payable_amount?: number;
    client: {
        id: number;
        nome_fantasia: string;
        razao_social: string;
        cpf_cnpj: string;
        whatsapp?: string;
        contatos?: Array<{
            telefone_principal?: string;
            telefone_secundario?: string;
            celular?: string;
            telefone_outro?: string;
            email_principal?: string;
            email_cobranca?: string;
            nome_contato?: string;
        }>;
    };
    plan?: {
        name: string;
    };
    justification?: string;
    action_date?: string;
    tiny_account_id?: string | null;
    autorizacao_numero?: string | null;
    parcel_number?: number;
    total_parcels?: number;
    sync_status?: string | null;
}

const formatInvoiceDate = (dateStr?: string | null) => {
    if (!dateStr) return '---';
    try {
        const cleanDate = dateStr.slice(0, 10);
        const date = new Date(`${cleanDate}T12:00:00`);
        if (isNaN(date.getTime())) return '---';
        return format(date, 'dd/MM/yyyy');
    } catch {
        return '---';
    }
};

const formatInvoiceTime = (dateStr?: string | null) => {
    if (!dateStr) return '---';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '---';
        return format(date, 'HH:mm');
    } catch {
        return '---';
    }
};

export default function InvoicesTab({ onFiltersChange }: { onFiltersChange?: (filters: any) => void }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Filters synchronized with URL
    const searchTerm = searchParams.get("q") || "";
    const statusFilter = searchParams.get("status") || "all";
    const syncFilter = searchParams.get("sync") || "all";
    const dateRange = searchParams.get("dateRange") || "all";
    const customStartDate = searchParams.get("start") || "";
    const customEndDate = searchParams.get("end") || "";

    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Advanced Filters Local States
    const [planId, setPlanId] = useState("all");
    const [vendedorId, setVendedorId] = useState("all");
    const [collectionTypes, setCollectionTypes] = useState<string[]>([]);
    const [termo, setTermo] = useState("");
    const [tipoPfPj, setTipoPfPj] = useState("all");
    const [cidade, setCidade] = useState("all");
    const [bairro, setBairro] = useState("");
    const [telefone, setTelefone] = useState("");
    const [numeroAutorizacaoDe, setNumeroAutorizacaoDe] = useState("");
    const [numeroAutorizacaoAte, setNumeroAutorizacaoAte] = useState("");
    const [dataCadInicial, setDataCadInicial] = useState("");
    const [dataCadFinal, setDataCadFinal] = useState("");
    const [tipoPublicidade, setTipoPublicidade] = useState("all");

    // Modal de Data do Recibo
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [receiptDate, setReceiptDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [receiptTarget, setReceiptTarget] = useState<{ type: 'single' | 'bulk', id?: number } | null>(null);

    // Applied Advanced Filters (to trigger search only on button click/clear)
    const [appliedFilters, setAppliedFilters] = useState<any>({
        planId: "all",
        vendedorId: "all",
        collectionTypes: [],
        termo: "",
        tipoPfPj: "all",
        cidade: "all",
        bairro: "",
        telefone: "",
        numeroAutorizacaoDe: "",
        numeroAutorizacaoAte: "",
        dataCadInicial: "",
        dataCadFinal: "",
        tipoPublicidade: "all",
    });

    const { data: plans } = useQuery({
        queryKey: ["plans"],
        queryFn: async () => {
            const resp = await axios.get("/v1/plans");
            return resp.data;
        }
    });

    const { data: vendedores } = useQuery({
        queryKey: ["comerciais"],
        queryFn: async () => {
            const resp = await axios.get("/v1/comerciais");
            return resp.data;
        }
    });

    const { data: cidadesList } = useCidades();

    const updateFilter = (key: string, value: string) => {
        setSearchParams(prev => {
            if (!value || value === "all") {
                prev.delete(key);
            } else {
                prev.set(key, value);
            }
            return prev;
        });
    };

    const setSearchTerm = (val: string) => updateFilter("q", val);
    const setStatusFilter = (val: string) => updateFilter("status", val);
    const setSyncFilter = (val: string) => updateFilter("sync", val);
    const setDateRange = (val: string) => updateFilter("dateRange", val);
    const setCustomStartDate = (val: string) => updateFilter("start", val);
    const setCustomEndDate = (val: string) => updateFilter("end", val);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    // Modal State
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [actionType, setActionType] = useState<'paid' | 'canceled' | null>(null);
    const [justification, setJustification] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isResending, setIsResending] = useState(false);

    // Edit Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editAmount, setEditAmount] = useState("");
    const [editDueDate, setEditDueDate] = useState("");
    const [editJustification, setEditJustification] = useState("");
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);
    const [editPaymentMethod, setEditPaymentMethod] = useState("pix");
    const [editDifferenceAction, setEditDifferenceAction] = useState<"discount" | "redistribute" | "create_extra" | "next_installment">("discount");
    const [editExtraDueDate, setEditExtraDueDate] = useState("");

    // Tiny Errors Modal
    const [tinyErrorsOpen, setTinyErrorsOpen] = useState(false);
    const [tinyErrorsList, setTinyErrorsList] = useState<string[]>([]);

    // Settle Modal
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
    const [settleGroupId, setSettleGroupId] = useState("");
    const [settleGroupParcels, setSettleGroupParcels] = useState<Invoice[]>([]);
    const [settleDiscount, setSettleDiscount] = useState("");
    const [settleDiscountType, setSettleDiscountType] = useState<"fixed" | "percent">("fixed");
    const [settlePaymentMethod, setSettlePaymentMethod] = useState("pix");
    const [settleJustification, setSettleJustification] = useState("");
    const [isSettleSubmitting, setIsSettleSubmitting] = useState(false);

    const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);

    const toggleSelectInvoice = (id: number) => {
        setSelectedInvoices(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkResendToTiny = async () => {
        if (selectedInvoices.length === 0) return;
        setIsResending(true);
        try {
            const response = await axios.post("/v1/financial/invoices/resend-to-tiny", { ids: selectedInvoices });
            toast.success(response.data.message || "Sincronização iniciada em background!");
            refetch();
            setSelectedInvoices([]);
        } catch (error) {
            console.error("Erro ao reenviar:", error);
            toast.error("Erro ao iniciar sincronização com o Tiny ERP.");
        } finally {
            setIsResending(false);
        }
    };

    const handleBulkMarkAsPaid = async () => {
        if (selectedInvoices.length === 0) return;
        if (!window.confirm(`Tem certeza que deseja marcar ${selectedInvoices.length} fatura(s) como paga(s)?`)) return;
        try {
            const loadingToast = toast.loading("Processando baixa em lote...");
            await axios.post(`/v1/financial/invoices/settle-batch`, {
                ids: selectedInvoices,
                payment_method: 'pix',
                justification: "Baixa em lote realizada pelo administrativo."
            });
            toast.success("Baixa em lote concluída!", { id: loadingToast });
            setSelectedInvoices([]);
            refetch();
        } catch (error) {
            toast.error("Erro ao realizar baixa em lote.");
        }
    };

    const handleBulkDownloadReceipts = async () => {
        if (selectedInvoices.length === 0) return;
        try {
            const loadingToast = toast.loading("Gerando pacote de recibos...");
            const response = await axios.post(`/v1/financial/invoices/batch-receipts`, {
                ids: selectedInvoices
            }, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Recibos_Lote_${format(new Date(), 'ddMMyyHHmm')}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Download iniciado!", { id: loadingToast });
            setSelectedInvoices([]);
        } catch (error) {
            toast.error("Erro ao gerar download em lote.");
        }
    };

    const handleBulkPrintReceipts = async (customDate?: string) => {
        if (selectedInvoices.length === 0) return;
        try {
            const loadingToast = toast.loading("Gerando recibos para impressão...");
            const response = await axios.post(`/v1/financial/invoices/print-receipts`, {
                ids: selectedInvoices,
                date: customDate
            }, {
                responseType: 'text'
            });
            
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(response.data);
                printWindow.document.close();
            } else {
                toast.error("Por favor, permita pop-ups para imprimir.");
            }
            toast.success("Recibos gerados com sucesso!", { id: loadingToast });
            setSelectedInvoices([]);
        } catch (error) {
            toast.error("Erro ao gerar recibos para impressão.");
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const response = await axios.post("/v1/financial/invoices/sync");
            toast.success(response.data.message || "Sincronização concluída!");
            refetch();
        } catch (error) {
            console.error("Erro ao sincronizar:", error);
            toast.error("Erro ao sincronizar com o Tiny ERP.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleResendToTiny = async () => {
        setIsResending(true);
        try {
            const response = await axios.post("/v1/financial/invoices/resend-to-tiny");
            const { enviadas, erros, total } = response.data;
            if (erros === 0) {
                toast.success(`${enviadas} de ${total} faturas enviadas ao Tiny com sucesso!`);
            } else {
                toast.success(`${enviadas} enviadas. ${erros} com erro — verifique o log.`);
            }
            refetch();
        } catch (error) {
            console.error("Erro ao reenviar:", error);
            toast.error("Erro ao reenviar faturas ao Tiny ERP.");
        } finally {
            setIsResending(false);
        }
    };

    const handleDownloadReceipt = async (invoiceId: number, customDate?: string) => {
        try {
            const loadingToast = toast.loading("Gerando recibo...");
            const params = customDate ? { date: customDate } : {};
            const response = await axios.get(`/v1/financial/invoices/${invoiceId}/receipt`, {
                params,
                responseType: 'blob'
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            toast.success("Recibo gerado com sucesso!", { id: loadingToast });
        } catch (error) {
            toast.error("Erro ao gerar recibo.");
        }
    };

    useEffect(() => {
        setCurrentPage(1);
        if (onFiltersChange) {
            const params: any = {};
            if (statusFilter !== "all") params.status = statusFilter;
            if (searchTerm) params.q = searchTerm;
            
            const today = new Date();
            if (dateRange === "current_month") {
                params.date_start = format(startOfMonth(today), 'yyyy-MM-dd');
                params.date_end = format(endOfMonth(today), 'yyyy-MM-dd');
            } else if (dateRange === "7") {
                params.date_start = format(subDays(today, 7), 'yyyy-MM-dd');
            } else if (dateRange === "15") {
                params.date_start = format(subDays(today, 15), 'yyyy-MM-dd');
            } else if (dateRange === "30") {
                params.date_start = format(subDays(today, 30), 'yyyy-MM-dd');
            } else if (dateRange === "custom") {
                if (customStartDate) params.date_start = customStartDate;
                if (customEndDate) params.date_end = customEndDate;
            }

            // Advanced filters mapped to stats request
            if (appliedFilters.planId !== "all") params.plan_id = appliedFilters.planId;
            if (appliedFilters.vendedorId !== "all") params.vendedor_id = appliedFilters.vendedorId;
            if (appliedFilters.collectionTypes.length > 0) {
                params.collection_type = appliedFilters.collectionTypes.join(",");
            }
            if (appliedFilters.termo) params.termo = appliedFilters.termo;
            if (appliedFilters.tipoPfPj !== "all") params.tipo_pf_pj = appliedFilters.tipoPfPj;
            if (appliedFilters.cidade !== "all") params.cidade = appliedFilters.cidade;
            if (appliedFilters.bairro) params.bairro = appliedFilters.bairro;
            if (appliedFilters.telefone) params.telefone = appliedFilters.telefone;
            if (appliedFilters.numeroAutorizacaoDe) params.numero_autorizacao_de = appliedFilters.numeroAutorizacaoDe;
            if (appliedFilters.numeroAutorizacaoAte) params.numero_autorizacao_ate = appliedFilters.numeroAutorizacaoAte;
            if (appliedFilters.dataCadInicial && appliedFilters.dataCadFinal) {
                params.data_cad_inicial = appliedFilters.dataCadInicial;
                params.data_cad_final = appliedFilters.dataCadFinal;
            }
            if (appliedFilters.tipoPublicidade !== "all") params.tipo_publicidade = appliedFilters.tipoPublicidade;

            onFiltersChange(params);
        }
    }, [statusFilter, searchTerm, dateRange, customStartDate, customEndDate, syncFilter, appliedFilters]);

    const { data: invoices, isLoading, refetch } = useQuery<Invoice[]>({
        queryKey: ["financial-invoices", statusFilter, searchTerm, dateRange, customStartDate, customEndDate, appliedFilters],
        queryFn: async () => {
            const params: any = {};
            if (statusFilter !== "all") params.status = statusFilter;
            if (searchTerm) params.q = searchTerm;
            
            const today = new Date();
            if (dateRange === "current_month") {
                params.date_start = format(startOfMonth(today), 'yyyy-MM-dd');
                params.date_end = format(endOfMonth(today), 'yyyy-MM-dd');
            } else if (dateRange === "7") {
                params.date_start = format(subDays(today, 7), 'yyyy-MM-dd');
            } else if (dateRange === "15") {
                params.date_start = format(subDays(today, 15), 'yyyy-MM-dd');
            } else if (dateRange === "30") {
                params.date_start = format(subDays(today, 30), 'yyyy-MM-dd');
            } else if (dateRange === "custom") {
                if (customStartDate) params.date_start = customStartDate;
                if (customEndDate) params.date_end = customEndDate;
            }

            // Advanced filters mapped to list request
            if (appliedFilters.planId !== "all") params.plan_id = appliedFilters.planId;
            if (appliedFilters.vendedorId !== "all") params.vendedor_id = appliedFilters.vendedorId;
            if (appliedFilters.collectionTypes.length > 0) {
                params.collection_type = appliedFilters.collectionTypes.join(",");
            }
            if (appliedFilters.termo) params.termo = appliedFilters.termo;
            if (appliedFilters.tipoPfPj !== "all") params.tipo_pf_pj = appliedFilters.tipoPfPj;
            if (appliedFilters.cidade !== "all") params.cidade = appliedFilters.cidade;
            if (appliedFilters.bairro) params.bairro = appliedFilters.bairro;
            if (appliedFilters.telefone) params.telefone = appliedFilters.telefone;
            if (appliedFilters.numeroAutorizacaoDe) params.numero_autorizacao_de = appliedFilters.numeroAutorizacaoDe;
            if (appliedFilters.numeroAutorizacaoAte) params.numero_autorizacao_ate = appliedFilters.numeroAutorizacaoAte;
            if (appliedFilters.dataCadInicial && appliedFilters.dataCadFinal) {
                params.data_cad_inicial = appliedFilters.dataCadInicial;
                params.data_cad_final = appliedFilters.dataCadFinal;
            }
            if (appliedFilters.tipoPublicidade !== "all") params.tipo_publicidade = appliedFilters.tipoPublicidade;

            const response = await axios.get("/v1/financial/invoices", { params });
            return response.data;
        },
    });

    const getWhatsAppLink = (invoice: Invoice, withText: boolean = false) => {
        // Tenta pegar o whatsapp direto, depois o celular do primeiro contato, depois o telefone principal
        const rawNumber = invoice.client.whatsapp ||
            invoice.client.contatos?.[0]?.celular ||
            invoice.client.contatos?.[0]?.telefone_principal ||
            '';

        // Remove tudo que não for número
        const cleaned = rawNumber.replace(/\D/g, '');

        if (!cleaned) return '#';

        // Garante o código do país (55 para Brasil) se tiver 10 ou 11 dígitos
        const phone = (cleaned.length <= 11 && !cleaned.startsWith('55')) ? `55${cleaned}` : cleaned;

        const baseUrl = `https://wa.me/${phone}`;

        if (withText) {
            const text = encodeURIComponent(`Olá ${invoice.client.nome_fantasia}, notamos que sua fatura de R$ ${Number(invoice.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} está disponível. Você pode acessar o boleto aqui: ${invoice.payment_url}`);
            return `${baseUrl}?text=${text}`;
        }

        return baseUrl;
    };

    const normalizeText = (text: string) => {
        return text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
    };

    const filteredInvoices = invoices?.filter((invoice) => {
        const searchNorm = normalizeText(searchTerm);
        
        let matchesSearch = true;
        if (searchTerm) {
            const isNumeric = /^\d+$/.test(searchTerm.trim());
            
            // 1. Busca por Autorização (match exato ou com padding de zeros ou com sufixo legado)
            const padded = searchTerm.trim().padStart(5, '0');
            const authNumStr = invoice.autorizacao_numero ? String(invoice.autorizacao_numero).trim() : "";
            const matchesAutorizacao = 
                authNumStr === searchTerm.trim() ||
                authNumStr === padded ||
                authNumStr === `${searchTerm.trim()}-legado` ||
                authNumStr === `${padded}-legado`;

            // 2. Busca por CNPJ (se tiver 8+ dígitos)
            const cleanSearch = searchTerm.trim();
            const matchesCnpj = cleanSearch.length >= 8 && invoice.client.cpf_cnpj?.includes(cleanSearch);

            // 3. Busca por Nome
            const matchesName = normalizeText(invoice.client.nome_fantasia).includes(searchNorm) ||
                normalizeText(invoice.client.razao_social || '').includes(searchNorm);

            // 4. Busca por Telefone (mínimo de 8 dígitos para evitar coincidências)
            let matchesPhone = false;
            const digitsSearch = searchTerm.replace(/\D/g, "");
            if (digitsSearch && digitsSearch.length >= 8) {
                const checkPhone = (p?: string) => {
                    if (!p) return false;
                    return p.replace(/\D/g, "").includes(digitsSearch);
                };

                const whatsappMatch = checkPhone(invoice.client.whatsapp);
                const contatosMatch = invoice.client.contatos?.some(c => 
                    checkPhone(c.telefone_principal) ||
                    checkPhone(c.telefone_secundario) ||
                    checkPhone(c.celular) ||
                    checkPhone(c.telefone_outro)
                ) || false;

                matchesPhone = whatsappMatch || contatosMatch;
            }

            if (isNumeric) {
                // Se for numérico: prioriza Autorização, depois CNPJ, depois Telefone
                matchesSearch = matchesAutorizacao || matchesCnpj || matchesPhone;
            } else {
                // Se não for numérico: Nome do cliente ou Telefone (ex: com formatação "(54) 98118-8149" ou "98118-8149")
                matchesSearch = matchesName || matchesPhone;
            }
        }

        const isOverdue = invoice.status === "pending" && isBefore(new Date(invoice.due_date), startOfDay(new Date()));

        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "overdue" ? isOverdue : invoice.status === statusFilter);

        // Date Filtering
        let matchesDate = true;
        const invoiceDateStr = invoice.due_date ? invoice.due_date.slice(0, 10) : "";
        const today = new Date();

        if (dateRange === "current_month") {
            const startMonthStr = format(startOfMonth(today), 'yyyy-MM-dd');
            const endMonthStr = format(endOfMonth(today), 'yyyy-MM-dd');
            matchesDate = invoiceDateStr >= startMonthStr && invoiceDateStr <= endMonthStr;
        } else if (dateRange === "7") {
            const limitStr = format(subDays(today, 7), 'yyyy-MM-dd');
            matchesDate = invoiceDateStr >= limitStr;
        } else if (dateRange === "15") {
            const limitStr = format(subDays(today, 15), 'yyyy-MM-dd');
            matchesDate = invoiceDateStr >= limitStr;
        } else if (dateRange === "30") {
            const limitStr = format(subDays(today, 30), 'yyyy-MM-dd');
            matchesDate = invoiceDateStr >= limitStr;
        } else if (dateRange === "custom") {
            if (customStartDate && customEndDate) {
                matchesDate = invoiceDateStr >= customStartDate && invoiceDateStr <= customEndDate;
            } else if (customStartDate) {
                matchesDate = invoiceDateStr >= customStartDate;
            } else if (customEndDate) {
                matchesDate = invoiceDateStr <= customEndDate;
            }
        }

        const matchesSync = syncFilter === "all" ||
            (syncFilter === "synced" ? !!invoice.tiny_account_id : !invoice.tiny_account_id);

        return matchesSearch && matchesStatus && matchesDate && matchesSync;
    });

    const getStatusBadge = (invoice: Invoice) => {
        const isOverdue = invoice.status === "pending" && new Date(invoice.due_date) < new Date();

        if (isOverdue) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 animate-pulse">
                    <AlertCircle size={12} /> Atrasado
                </span>
            );
        }

        switch (invoice.status) {
            case "paid":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <CheckCircle2 size={12} /> Pago
                    </span>
                );
            case "pending":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        <Clock size={12} /> Aguardando
                    </span>
                );
            case "canceled":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        <X size={12} /> Cancelado
                    </span>
                );
            default:
                return <span className="text-gray-500">{invoice.status}</span>;
        }
    };

    const totalItems = filteredInvoices?.length || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedInvoices = filteredInvoices?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-sm flex-1">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="Buscar por autorização, cliente ou CNPJ..."
                        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Status:</span>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px] h-9 border-gray-200 rounded-xl text-xs font-bold">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                <SelectItem value="all">Todos Status</SelectItem>
                                <SelectItem value="pending">Aguardando</SelectItem>
                                <SelectItem value="overdue">Atrasados ⚠️</SelectItem>
                                <SelectItem value="paid">Pagos</SelectItem>
                                <SelectItem value="canceled">Cancelados</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">ERP:</span>
                        <Select value={syncFilter} onValueChange={setSyncFilter}>
                            <SelectTrigger className="w-[140px] h-9 border-gray-200 rounded-xl text-xs font-bold">
                                <SelectValue placeholder="ERP" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                <SelectItem value="all">Ver Todas</SelectItem>
                                <SelectItem value="synced">Sincronizadas</SelectItem>
                                <SelectItem value="unsynced">Pendentes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Período:</span>
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-[160px] h-9 border-gray-200 rounded-xl text-xs font-bold">
                                <SelectValue placeholder="Data de Vencimento" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                <SelectItem value="all">Qualquer data</SelectItem>
                                <SelectItem value="current_month">Mês Atual</SelectItem>
                                <SelectItem value="7">Últimos 7 dias</SelectItem>
                                <SelectItem value="15">Últimos 15 dias</SelectItem>
                                <SelectItem value="30">Últimos 30 dias</SelectItem>
                                <SelectItem value="custom">Personalizado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="h-9 border-gray-200 rounded-xl px-4 text-xs font-bold gap-2 hover:bg-gray-50 bg-white"
                    >
                        <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? "Sincronizando..." : "Sincronizar Tiny"}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResendToTiny}
                        disabled={isResending}
                        className="h-9 border-orange-200 rounded-xl px-4 text-xs font-bold gap-2 hover:bg-orange-50 bg-white text-orange-700"
                        title="Envia ao Tiny as faturas que ainda não foram registradas lá"
                    >
                        <Send size={14} className={isResending ? "animate-pulse" : ""} />
                        {isResending ? "Reenviando..." : "Reenviar ao Tiny"}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAdvancedFilters(prev => !prev)}
                        className={cn(
                            "h-9 border-gray-200 rounded-xl px-4 text-xs font-bold gap-2 hover:bg-gray-50 bg-white",
                            showAdvancedFilters && "border-red-300 bg-red-50 text-red-700 hover:bg-red-50"
                        )}
                    >
                        <Filter size={14} />
                        {showAdvancedFilters ? "Ocultar Filtros" : "Filtros Avançados"}
                    </Button>

                    {dateRange === "custom" && (
                        <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-300">
                            <input
                                type="date"
                                className="w-32 h-9 rounded-xl border border-gray-200 px-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-500"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                            />
                            <span className="text-[10px] font-bold text-gray-400 uppercase">até</span>
                            <input
                                type="date"
                                className="w-32 h-9 rounded-xl border border-gray-200 px-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-500"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {showAdvancedFilters && (
                <div className="p-6 border border-gray-150 shadow-sm rounded-2xl bg-white space-y-4 animate-in fade-in slide-in-from-top-2 duration-250">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-[#B70F0A]" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Filtros Avançados do Financeiro</h4>
                        </div>
                        <button
                            onClick={() => {
                                setPlanId("all");
                                setVendedorId("all");
                                setCollectionTypes([]);
                                setTermo("");
                                setTipoPfPj("all");
                                setCidade("all");
                                setBairro("");
                                setTelefone("");
                                setNumeroAutorizacaoDe("");
                                setNumeroAutorizacaoAte("");
                                setDataCadInicial("");
                                setDataCadFinal("");
                                setTipoPublicidade("all");
                                setAppliedFilters({
                                    planId: "all",
                                    vendedorId: "all",
                                    collectionTypes: [],
                                    termo: "",
                                    tipoPfPj: "all",
                                    cidade: "all",
                                    bairro: "",
                                    telefone: "",
                                    numeroAutorizacaoDe: "",
                                    numeroAutorizacaoAte: "",
                                    dataCadInicial: "",
                                    dataCadFinal: "",
                                    tipoPublicidade: "all",
                                });
                            }}
                            className="text-[10px] font-black text-[#B70F0A] hover:underline uppercase tracking-wider"
                        >
                            Limpar Filtros
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        {/* Nº Autorização (Faixa) */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Nº Autorização (Faixa)</label>
                            <div className="flex items-center gap-1.5">
                                <Input 
                                    placeholder="De" 
                                    className="rounded-xl border-gray-150 bg-gray-50/50 h-10 text-xs text-center font-semibold"
                                    value={numeroAutorizacaoDe}
                                    onChange={e => setNumeroAutorizacaoDe(e.target.value)}
                                />
                                <span className="text-gray-300 text-[10px] font-black uppercase">a</span>
                                <Input 
                                    placeholder="Até" 
                                    className="rounded-xl border-gray-150 bg-gray-50/50 h-10 text-xs text-center font-semibold"
                                    value={numeroAutorizacaoAte}
                                    onChange={e => setNumeroAutorizacaoAte(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Tipo de Produto */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tipo de Produto</label>
                            <Select value={planId} onValueChange={setPlanId}>
                                <SelectTrigger className="rounded-xl border-gray-150 bg-gray-50/50 h-10">
                                    <SelectValue placeholder="Todos os Planos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Planos</SelectItem>
                                    {plans?.map((p: any) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Vendedor */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Vendedor</label>
                            <Select value={vendedorId} onValueChange={setVendedorId}>
                                <SelectTrigger className="rounded-xl border-gray-150 bg-gray-50/50 h-10">
                                    <SelectValue placeholder="Todos os Vendedores" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Vendedores</SelectItem>
                                    {vendedores?.map((v: any) => (
                                        <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Cobrança / Pagamento */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cobrança / Pagamento</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between rounded-xl border-gray-150 bg-gray-50/50 h-10 px-3 text-left font-normal text-xs hover:bg-gray-50/50 hover:border-gray-250 transition-all shadow-none"
                                    >
                                        <span className="truncate text-gray-700 font-bold">
                                            {collectionTypes.length === 0
                                                ? "Todos os tipos"
                                                : collectionTypes.length === 1
                                                ? [
                                                    { value: "bank", label: "Boleto Bancário" },
                                                    { value: "card", label: "Cartão de Crédito/Débito" },
                                                    { value: "pix", label: "Pix / Transferência" },
                                                    { value: "cash", label: "Cheque / Dinheiro" },
                                                    { value: "permuta", label: "Permuta" },
                                                    { value: "direct", label: "Faturamento Direto" }
                                                  ].find(o => o.value === collectionTypes[0])?.label
                                                : `${collectionTypes.length} selecionados`}
                                        </span>
                                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[220px] p-2 bg-white rounded-xl shadow-md border border-gray-150 z-50 animate-in fade-in zoom-in-95 duration-100" align="start">
                                    <div className="space-y-1">
                                        {[
                                            { value: "bank", label: "Boleto Bancário" },
                                            { value: "card", label: "Cartão de Crédito/Débito" },
                                            { value: "pix", label: "Pix / Transferência" },
                                            { value: "cash", label: "Cheque / Dinheiro" },
                                            { value: "permuta", label: "Permuta" },
                                            { value: "direct", label: "Faturamento Direto" }
                                        ].map((option) => {
                                            const isSelected = collectionTypes.includes(option.value);
                                            return (
                                                <div
                                                    key={option.value}
                                                    onClick={() => {
                                                        setCollectionTypes(prev =>
                                                            prev.includes(option.value)
                                                                ? prev.filter(v => v !== option.value)
                                                                : [...prev, option.value]
                                                        );
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold hover:bg-red-50/50 hover:text-[#B70F0A] transition-all",
                                                        isSelected && "bg-red-50 text-[#B70F0A]"
                                                    )}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {}} // handled by click
                                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-4 w-4 cursor-pointer"
                                                    />
                                                    <span>{option.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Tipo de Cliente */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tipo de Cliente</label>
                            <Select value={tipoPfPj} onValueChange={setTipoPfPj}>
                                <SelectTrigger className="rounded-xl border-gray-150 bg-gray-50/50 h-10">
                                    <SelectValue placeholder="PF / PJ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Ambos</SelectItem>
                                    <SelectItem value="pf">Pessoa Física</SelectItem>
                                    <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tipo de Publicidade */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tipo de Publicidade</label>
                            <Select value={tipoPublicidade} onValueChange={setTipoPublicidade}>
                                <SelectTrigger className="rounded-xl border-gray-150 bg-gray-50/50 h-10">
                                    <SelectValue placeholder="WEB/Impressa" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="WEB">WEB</SelectItem>
                                    <SelectItem value="APP">APP</SelectItem>
                                    <SelectItem value="IMPRESSO">Impressa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Termo da Consulta */}
                        <div className="space-y-2 lg:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Termo da Consulta (Nome/Razão/CNPJ)</label>
                            <Input 
                                placeholder="Buscar..." 
                                className="rounded-xl border-gray-150 bg-gray-50/50 h-10"
                                value={termo}
                                onChange={e => setTermo(e.target.value)}
                            />
                        </div>

                        {/* Cidade */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cidade</label>
                            <Select value={cidade} onValueChange={setCidade}>
                                <SelectTrigger className="rounded-xl border-gray-150 bg-gray-50/50 h-10">
                                    <SelectValue placeholder="Todas as cidades" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as cidades</SelectItem>
                                    {cidadesList?.map((c) => (
                                        <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Bairro */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Bairro</label>
                            <Input 
                                placeholder="Bairro" 
                                className="rounded-xl border-gray-150 bg-gray-50/50 h-10"
                                value={bairro}
                                onChange={e => setBairro(e.target.value)}
                            />
                        </div>

                        {/* Telefone */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Telefone</label>
                            <Input 
                                placeholder="Ex: 54999..." 
                                className="rounded-xl border-gray-150 bg-gray-50/50 h-10"
                                value={telefone}
                                onChange={e => setTelefone(e.target.value)}
                            />
                        </div>

                        {/* Data Emissão */}
                        <div className="space-y-2 lg:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Data Emissão (Cad. Inicial/Final)</label>
                            <DateRangePicker 
                                startDate={dataCadInicial} 
                                endDate={dataCadFinal} 
                                onRangeChange={(start, end) => {
                                    setDataCadInicial(start);
                                    setDataCadFinal(end);
                                }}
                            />
                        </div>

                        {/* Botão Aplicar Filtros */}
                        <div className="space-y-2 lg:col-span-2 flex items-end">
                            <Button 
                                onClick={() => {
                                    setAppliedFilters({
                                        planId,
                                        vendedorId,
                                        collectionTypes,
                                        termo,
                                        tipoPfPj,
                                        cidade,
                                        bairro,
                                        telefone,
                                        numeroAutorizacaoDe,
                                        numeroAutorizacaoAte,
                                        dataCadInicial,
                                        dataCadFinal,
                                        tipoPublicidade,
                                    });
                                }}
                                className="w-full rounded-xl bg-gray-900 hover:bg-black text-white font-bold h-10 gap-2 shadow-sm"
                            >
                                <Search size={16} />
                                Aplicar Filtros Avançados
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {selectedInvoices.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl mb-4 animate-in fade-in slide-in-from-top-2">
                    <span className="text-xs font-black uppercase text-red-600 mr-2">
                        {selectedInvoices.length} selecionada(s)
                    </span>
                    <button
                        onClick={handleBulkDownloadReceipts}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-bold text-[10px] uppercase border border-emerald-100 shadow-sm"
                    >
                        <Download size={14} />
                        Baixar Recibos
                    </button>
                    <button
                        onClick={() => handleBulkPrintReceipts()}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white text-violet-600 rounded-lg hover:bg-violet-50 transition-colors font-bold text-[10px] uppercase border border-violet-100 shadow-sm"
                    >
                        <Printer size={14} />
                        Imprimir
                    </button>
                    <button
                        onClick={handleBulkMarkAsPaid}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-bold text-[10px] uppercase border border-blue-100 shadow-sm"
                    >
                        <CheckCircle2 size={14} />
                        Dar Baixa
                    </button>
                    <button
                        onClick={handleBulkResendToTiny}
                        disabled={isResending}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-bold text-[10px] uppercase border border-orange-100 shadow-sm disabled:opacity-50"
                    >
                        <Send size={14} className={isResending ? "animate-pulse" : ""} />
                        {isResending ? "Sincronizando..." : "Sincronizar Tiny"}
                    </button>
                    <button
                        onClick={() => setSelectedInvoices([])}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors ml-auto"
                        title="Limpar seleção"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '900px' }}>
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 w-10">
                                <input
                                    type="checkbox"
                                    checked={paginatedInvoices?.length! > 0 && selectedInvoices.length === paginatedInvoices?.length}
                                    onChange={() => {
                                        if (selectedInvoices.length === paginatedInvoices?.length) {
                                            setSelectedInvoices([]);
                                        } else {
                                            setSelectedInvoices(paginatedInvoices?.map(i => i.id) || []);
                                        }
                                    }}
                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer h-4 w-4"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Autorização / Parcela
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Cliente
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Valor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Vencimento
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Pagamento
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                ERP
                            </th>
                            <th className="sticky right-0 bg-gray-50 px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)] z-10">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex justify-center">
                                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                                    </div>
                                    <p className="mt-2 text-sm">Carregando faturas...</p>
                                </td>
                            </tr>
                        ) : paginatedInvoices?.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    Nenhuma fatura encontrada.
                                </td>
                            </tr>
                        ) : (
                            paginatedInvoices?.map((invoice) => {
                                const isOverdue = invoice.status === "pending" && isBefore(new Date(invoice.due_date), startOfDay(new Date()));

                                return (
                                    <tr 
                                        key={invoice.id} 
                                        onClick={() => {
                                            if (invoice.sync_status !== 'syncing') {
                                                navigate(`/clientes/${invoice.client.id}/editar?step=12`);
                                            }
                                        }}
                                        className={cn(
                                            "hover:bg-red-50/40 hover:shadow-sm cursor-pointer transition-all duration-200 group", 
                                            selectedInvoices.includes(invoice.id) && "bg-red-50/30",
                                            invoice.sync_status === 'syncing' && "opacity-75 cursor-not-allowed"
                                        )}
                                    >
                                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedInvoices.includes(invoice.id)}
                                                onChange={() => toggleSelectInvoice(invoice.id)}
                                                disabled={invoice.sync_status === 'syncing'}
                                                className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer h-4 w-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900">
                                                    {invoice.autorizacao_numero ? `${invoice.autorizacao_numero}` : "-"}
                                                </span>
                                                {invoice.parcel_number && invoice.total_parcels && (
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                                                        Parcela {invoice.parcel_number}/{invoice.total_parcels}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button className="text-left group" disabled={invoice.sync_status === 'syncing'}>
                                                        <div className="text-sm font-bold text-gray-900 group-hover:text-red-700 transition-colors flex items-center gap-1">
                                                            {invoice.client.nome_fantasia || invoice.client.razao_social}
                                                            <ChevronDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                        {invoice.client.razao_social && invoice.client.nome_fantasia && invoice.client.razao_social !== invoice.client.nome_fantasia && (
                                                            <div className="text-[11px] text-gray-400 font-medium truncate max-w-[250px]" title={invoice.client.razao_social}>
                                                                {invoice.client.razao_social}
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-gray-500">
                                                            {invoice.client.cpf_cnpj}
                                                        </div>
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80 p-0 shadow-xl border-gray-100 rounded-2xl overflow-hidden">
                                                    <div className="bg-gray-900 p-4 text-white">
                                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ficha de Cobrança</p>
                                                        <h4 className="font-black text-lg truncate">{invoice.client.nome_fantasia}</h4>
                                                    </div>
                                                    <div className="p-4 space-y-4">
                                                        <div className="space-y-2">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Contatos Rápidos</p>
                                                            <div className="grid grid-cols-1 gap-2">
                                                                <a
                                                                    href={`mailto:${invoice.client.contatos?.[0]?.email_principal || ''}`}
                                                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-600 border border-transparent hover:border-gray-100"
                                                                >
                                                                    <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600"><Mail size={14} /></div>
                                                                    {invoice.client.contatos?.[0]?.email_principal || 'E-mail não cadastrado'}
                                                                </a>
                                                                <a
                                                                    href={`tel:${invoice.client.contatos?.[0]?.telefone_principal || ''}`}
                                                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-600 border border-transparent hover:border-gray-100"
                                                                >
                                                                    <div className="bg-gray-50 p-1.5 rounded-lg text-gray-600"><Phone size={14} /></div>
                                                                    {invoice.client.contatos?.[0]?.telefone_principal || 'Tel não cadastrado'}
                                                                </a>
                                                                <a
                                                                    href={getWhatsAppLink(invoice)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-green-50 transition-colors text-sm text-green-700 border border-transparent hover:border-green-100 font-medium"
                                                                >
                                                                    <div className="bg-green-100 p-1.5 rounded-lg text-green-600"><MessageCircle size={14} /></div>
                                                                    Conversar no WhatsApp
                                                                </a>
                                                            </div>
                                                        </div>
                                                        <div className="pt-2 border-t border-gray-50 flex justify-between">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-xs font-bold text-gray-400 hover:text-gray-900"
                                                                onClick={() => navigate(`/clientes/${invoice.client.id}/editar`)}
                                                            >
                                                                Ver Histórico Completo
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    R$ {Number(invoice.payable_amount ?? invoice.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                                {invoice.amount !== undefined && invoice.payable_amount !== undefined && Number(invoice.payable_amount) < Number(invoice.amount) && Number(invoice.payable_amount) > 0 && (
                                                    <span className="text-[10px] text-gray-500 font-medium mt-0.5">
                                                        (Total: R$ {Number(invoice.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Pago: R$ {(Number(invoice.amount) - Number(invoice.payable_amount)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                                                    </span>
                                                )}
                                                {invoice.is_permuta && (
                                                    <span className="text-[9px] text-orange-600 font-bold uppercase tracking-tight bg-orange-50 px-1.5 py-0.5 rounded w-fit mt-1 border border-orange-100/50">
                                                        + Permuta R$ {Number(invoice.permuta_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                            <div className={cn(
                                                "flex items-center gap-1",
                                                isOverdue ? "text-red-600 font-bold" : "text-gray-500"
                                            )}>
                                                <Calendar size={14} />
                                                {formatInvoiceDate(invoice.due_date)}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                            {invoice.status === 'paid' && invoice.action_date ? (
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-700">
                                                        {formatInvoiceDate(invoice.action_date)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-tight">
                                                        {formatInvoiceTime(invoice.action_date)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 font-medium">-</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            {getStatusBadge(invoice)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            {invoice.sync_status === 'syncing' ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-100 animate-pulse">
                                                    <RefreshCw size={10} className="animate-spin" /> Sincronizando...
                                                </span>
                                            ) : invoice.sync_status ? (
                                                <div className="relative group/erp-error inline-block" onClick={(e) => e.stopPropagation()}>
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 border border-red-100 cursor-help shadow-sm">
                                                        <AlertCircle size={10} /> Falha no Envio
                                                    </span>
                                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-slate-900 text-white text-[11px] rounded-2xl opacity-0 invisible group-hover/erp-error:opacity-100 group-hover/erp-error:visible transition-all shadow-2xl z-50 leading-relaxed font-semibold flex flex-col gap-1">
                                                        <span className="font-extrabold text-[10px] text-red-400 uppercase tracking-widest flex items-center gap-1">
                                                            <AlertCircle size={12} /> Falha no Envio ERP
                                                        </span>
                                                        <span className="text-slate-200 font-medium whitespace-normal">
                                                            {invoice.sync_status}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 mt-1 border-t border-slate-800 pt-1">
                                                            Dica: Clique na linha para abrir o cadastro e corrigir.
                                                        </span>
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                                                    </div>
                                                </div>
                                            ) : invoice.tiny_account_id ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                                    <Check size={10} /> Sincronizada
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-100">
                                                    <RefreshCw size={10} /> Pendente
                                                </span>
                                            )}
                                        </td>
                                        <td className="sticky right-0 bg-white whitespace-nowrap px-6 py-4 text-right group-hover:bg-red-50/40 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)] z-10" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-2">
                                                {invoice.sync_status === 'syncing' ? (
                                                    <span className="text-xs font-semibold text-gray-400 italic">Processando...</span>
                                                ) : (
                                                    <>
                                                        {invoice.payment_url && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(invoice.payment_url!);
                                                                        toast.success("Link copiado!");
                                                                    }}
                                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                                    title="Copiar Link de Pagamento"
                                                                >
                                                                    <Copy size={16} />
                                                                </button>

                                                                <a
                                                                    href={getWhatsAppLink(invoice, true)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                                                    title="Enviar via WhatsApp"
                                                                >
                                                                    <MessageCircle size={16} />
                                                                </a>

                                                                <a
                                                                    href={invoice.payment_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Ver Boleto Original"
                                                                >
                                                                    <ExternalLink size={16} />
                                                                </a>
                                                            </>
                                                        )}

                                                        {invoice.status === "pending" && (
                                                            <>
                                                                <Link
                                                                    to={`/clientes/${invoice.client.id}/editar?step=12`}
                                                                    className="p-2 text-blue-500 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Abrir Cliente (Aba Financeiro)"
                                                                >
                                                                    <Pencil size={15} />
                                                                </Link>
                                                                {invoice.group_id && invoice.total_parcels && invoice.total_parcels > 1 && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const groupParcels = (invoices ?? []).filter(
                                                                                i => i.group_id === invoice.group_id && i.status === 'pending'
                                                                            );
                                                                            setSettleGroupId(invoice.group_id!);
                                                                            setSettleGroupParcels(groupParcels);
                                                                            setSettleDiscount("");
                                                                            setSettleJustification("");
                                                                            setSettlePaymentMethod("pix");
                                                                            setIsSettleModalOpen(true);
                                                                        }}
                                                                        className="p-2 text-purple-500 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                                                                        title="Quitar Parcelas Restantes"
                                                                    >
                                                                        <Landmark size={15} />
                                                                    </button>
                                                                )}

                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedInvoice(invoice);
                                                                        setActionType('paid');
                                                                        setJustification("");
                                                                        setEditPaymentMethod(invoice.payment_method || "pix");
                                                                        setIsActionModalOpen(true);
                                                                    }}
                                                                    className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                                                                    title="Dar Baixa (Confirmar Pagamento)"
                                                                >
                                                                    <Check size={18} />
                                                                </button>

                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedInvoice(invoice);
                                                                        setActionType('canceled');
                                                                        setJustification("");
                                                                        setIsActionModalOpen(true);
                                                                    }}
                                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Cancelar Fatura"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}

                                                        <button
                                                            onClick={() => handleDownloadReceipt(invoice.id)}
                                                            className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="Imprimir Recibo de Pagamento"
                                                        >
                                                            <Printer size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                </div>
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 font-medium">Mostrar:</span>
                                <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                                    <SelectTrigger className="w-[70px] h-8 bg-white border-gray-200 text-xs font-bold rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                        <SelectItem value="150">150</SelectItem>
                                        <SelectItem value="999999">Todas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <span className="text-gray-500">
                                Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} a {Math.min(currentPage * itemsPerPage, totalItems)} de <span className="font-bold text-gray-900">{totalItems}</span> faturas
                            </span>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="h-7 px-3 text-xs font-bold rounded-md"
                                >
                                    Anterior
                                </Button>
                                
                                <span className="text-gray-500 px-3 text-xs">
                                    Pág <span className="font-bold text-gray-900">{currentPage}</span> de {totalPages}
                                </span>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="h-7 px-3 text-xs font-bold rounded-md"
                                >
                                    Próxima
                                </Button>
                            </div>
                        )}

                        <div className="text-gray-500 font-medium">
                            Total filtrado: <span className="font-bold text-gray-900 text-base">
                                R$ {filteredInvoices?.reduce((acc, inv) => acc + Number(inv.amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Modal (Paid/Cancel) */}
            <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black flex items-center gap-2">
                            {actionType === 'paid' ? (
                                <><CheckCircle2 className="text-green-600" /> Confirmar Pagamento</>
                            ) : (
                                <><Trash2 className="text-red-600" /> Confirmar Cancelamento</>
                            )}
                        </DialogTitle>
                        <DialogDescription className="font-medium">
                            {actionType === 'paid'
                                ? "Você está marcando esta fatura como paga manualmente. Como o pagamento foi realizado?"
                                : "Você está cancelando esta fatura. Qual o motivo do cancelamento?"
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {actionType === 'paid' && (
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
                                    Forma de Pagamento
                                </label>
                                <div className="grid grid-cols-4 gap-2 mt-2 px-1">
                                    {[
                                        { id: 'pix', label: 'Pix', icon: <Smartphone size={14} /> },
                                        { id: 'dinheiro', label: 'Dinheiro', icon: <DollarSign size={14} /> },
                                        { id: 'cartao', label: 'Cartão', icon: <CreditCard size={14} /> },
                                        { id: 'boleto', label: 'Boleto', icon: <Barcode size={14} /> }
                                    ].map(method => (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => setEditPaymentMethod(method.id)}
                                            className={cn(
                                                "flex flex-col items-center justify-center py-3 px-1 rounded-2xl border-2 transition-all gap-1.5",
                                                editPaymentMethod === method.id 
                                                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-100" 
                                                    : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                                            )}
                                        >
                                            {method.icon}
                                            <span className="text-[10px] font-black uppercase tracking-tighter">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                Justificativa (Opcional)
                            </label>
                            <Textarea
                                placeholder={actionType === 'paid' ? "Ex: Pago via PIX direto, Transferência bancária..." : "Ex: Erro no valor, cliente desistiu, faturamento duplicado..."}
                                value={justification}
                                onChange={(e) => setJustification(e.target.value)}
                                className="min-h-[100px] rounded-2xl border-gray-200 focus:ring-red-500"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button
                            variant="secondary"
                            onClick={() => setIsActionModalOpen(false)}
                            className="rounded-xl font-bold"
                        >
                            Voltar
                        </Button>
                        <Button
                            variant={actionType === 'paid' ? 'default' : 'destructive'}
                            disabled={isSubmitting}
                            className={cn(
                                "rounded-xl font-black px-8",
                                actionType === 'paid' && "bg-green-600 hover:bg-green-700"
                            )}
                            onClick={async () => {
                                if (!selectedInvoice || !actionType) return;
                                setIsSubmitting(true);
                                try {
                                    await axios.patch(`/v1/financial/invoices/${selectedInvoice.id}/status`, {
                                        status: actionType,
                                        justification: justification || (actionType === 'paid' ? 'Baixa manual confirmada' : 'Cancelamento manual confirmado'),
                                        payment_method: actionType === 'paid' ? editPaymentMethod : undefined,
                                    });
                                    toast.success(actionType === 'paid' ? "Fatura liquidada!" : "Fatura cancelada.");
                                    refetch();
                                    queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
                                    setIsActionModalOpen(false);
                                } catch (error) {
                                    toast.error("Erro ao atualizar fatura.");
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                        >
                            {isSubmitting ? "Processando..." : "Confirmar Ação"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Edit Invoice Modal ───────────────────────── */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-lg rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black flex items-center gap-2">
                            <Pencil className="text-blue-600" size={20} /> Editar Fatura
                        </DialogTitle>
                        <DialogDescription className="font-medium">
                            Altere o valor ou a data de vencimento desta parcela.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Campos principais */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Novo Valor (R$)</label>
                                <Input
                                    type="number" min="0" step="0.01"
                                    value={editAmount}
                                    onChange={e => setEditAmount(e.target.value)}
                                    className="rounded-xl border-gray-200 font-bold text-gray-900"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Data de Pagamento</label>
                                <Input
                                    type="date" value={editDueDate}
                                    onChange={e => setEditDueDate(e.target.value)}
                                    className="rounded-xl border-gray-200 font-bold text-gray-900"
                                />
                            </div>
                        </div>

                        {/* Forma de pagamento */}
                        <div className="space-y-1 mt-4">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Forma de Pagamento (Caso vá concluir o pagamento)</label>
                            <Select value={editPaymentMethod} onValueChange={setEditPaymentMethod}>
                                <SelectTrigger className="w-full rounded-xl border-gray-200">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pix">Pix</SelectItem>
                                    <SelectItem value="boleto">Boleto</SelectItem>
                                    <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Painel da diferença — aparece quando o valor muda */}
                        {(() => {
                            const originalAmount = selectedInvoice ? Number(selectedInvoice.payable_amount ?? selectedInvoice.amount) : 0;
                            const newAmt = Number(editAmount);
                            const diff = Math.round((originalAmount - newAmt) * 100) / 100;
                            if (!editAmount || Math.abs(diff) < 0.01) return null;

                            const hasSiblings = selectedInvoice?.group_id && (selectedInvoice.total_parcels ?? 1) > 1;
                            const hasNextSibling = hasSiblings && (invoices ?? []).some(i => 
                                i.group_id === selectedInvoice?.group_id && 
                                i.status === 'pending' && 
                                (i.parcel_number ?? 0) > (selectedInvoice?.parcel_number ?? 0)
                            );

                            return (
                                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
                                            <Info size={14} /> Diferença detectada
                                        </p>
                                        <span className={`text-sm font-black px-3 py-1 rounded-full ${
                                            diff > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {diff > 0 ? '-' : '+'}R$ {Math.abs(diff).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <p className="text-xs text-blue-700 font-medium">O que fazer com esta diferença?</p>

                                    <div className="space-y-2">
                                        <label className="flex items-start gap-3 p-2.5 rounded-xl border border-blue-100 bg-white cursor-pointer hover:border-blue-300 transition-colors">
                                            <input type="radio" name="diff_action" value="discount"
                                                checked={editDifferenceAction === 'discount'}
                                                onChange={() => setEditDifferenceAction('discount')}
                                                className="mt-0.5 accent-blue-600"
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">💸 Desconto / Remissão</p>
                                                <p className="text-xs text-gray-500">A diferença é descartada. O total do grupo diminui.</p>
                                            </div>
                                        </label>

                                        {hasSiblings && (
                                            <label className="flex items-start gap-3 p-2.5 rounded-xl border border-blue-100 bg-white cursor-pointer hover:border-blue-300 transition-colors">
                                                <input type="radio" name="diff_action" value="redistribute"
                                                    checked={editDifferenceAction === 'redistribute'}
                                                    onChange={() => setEditDifferenceAction('redistribute')}
                                                    className="mt-0.5 accent-blue-600"
                                                />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">📊 Redistribuir nas parcelas seguintes</p>
                                                    <p className="text-xs text-gray-500">A diferença é distribuída igualmente entre as outras parcelas pendentes. O total do grupo é preservado.</p>
                                                </div>
                                            </label>
                                        )}

                                        {hasNextSibling && (
                                            <label className="flex items-start gap-3 p-2.5 rounded-xl border border-blue-100 bg-white cursor-pointer hover:border-blue-300 transition-colors">
                                                <input type="radio" name="diff_action" value="next_installment"
                                                    checked={editDifferenceAction === 'next_installment'}
                                                    onChange={() => setEditDifferenceAction('next_installment')}
                                                    className="mt-0.5 accent-blue-600"
                                                />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">
                                                        {diff > 0 ? "📈 Adicionar na próxima parcela" : "📉 Descontar na próxima parcela"}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {diff > 0 
                                                            ? `O valor de R$ ${Math.abs(diff).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} será somado à próxima parcela.` 
                                                            : `O valor de R$ ${Math.abs(diff).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} será deduzido da próxima parcela.`
                                                        }
                                                    </p>
                                                </div>
                                            </label>
                                        )}

                                        {diff > 0 && (
                                            <label className="flex items-start gap-3 p-2.5 rounded-xl border border-blue-100 bg-white cursor-pointer hover:border-blue-300 transition-colors">
                                                <input type="radio" name="diff_action" value="create_extra"
                                                    checked={editDifferenceAction === 'create_extra'}
                                                    onChange={() => setEditDifferenceAction('create_extra')}
                                                    className="mt-0.5 accent-blue-600"
                                                />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">📄 Criar parcela extra</p>
                                                    <p className="text-xs text-gray-500">Uma nova parcela de R$ {Math.abs(diff).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} será criada para o cliente pagar depois.</p>
                                                </div>
                                            </label>
                                        )}
                                    </div>

                                    {editDifferenceAction === 'create_extra' && diff > 0 && (
                                        <div className="space-y-1 pt-1">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Vencimento da Parcela Extra</label>
                                            <Input
                                                type="date" value={editExtraDueDate}
                                                onChange={e => setEditExtraDueDate(e.target.value)}
                                                className="rounded-xl border-blue-200 font-bold"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Motivo / Observação (Opcional)</label>
                            <Textarea
                                placeholder="Ex: Negociação comercial, correção de valor..."
                                value={editJustification}
                                onChange={e => setEditJustification(e.target.value)}
                                className="min-h-[80px] rounded-2xl border-gray-200"
                            />
                        </div>

                        {/* Tiny ERP transparency panel */}
                        <div className={`border rounded-2xl p-4 space-y-2 ${
                            selectedInvoice?.tiny_account_id ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
                        }`}>
                            <p className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${
                                selectedInvoice?.tiny_account_id ? 'text-orange-700' : 'text-gray-500'
                            }`}>
                                <Info size={14} /> {selectedInvoice?.tiny_account_id ? 'O que será feito no Tiny ERP' : 'Sem sincronização com Tiny ERP'}
                            </p>
                            {selectedInvoice?.tiny_account_id ? (
                                <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
                                    <li>Conta <strong>#{selectedInvoice.tiny_account_id}</strong> será atualizada com o novo valor e vencimento</li>
                                    {editDifferenceAction === 'redistribute' && <li>Contas das parcelas seguintes também serão atualizadas no Tiny</li>}
                                    {editDifferenceAction === 'next_installment' && <li>A conta da <strong>próxima parcela</strong> será atualizada no Tiny com o novo valor</li>}
                                    {editDifferenceAction === 'create_extra' && <li>Uma nova conta a receber será criada no Tiny para a parcela extra</li>}
                                    {editDifferenceAction === 'discount' && <li>Nenhuma outra conta será afetada no Tiny</li>}
                                </ul>
                            ) : (
                                <p className="text-xs font-bold text-gray-500">Esta fatura não está no Tiny ERP. Apenas o sistema local será alterado.</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:justify-end flex-wrap">
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                        <Button
                            disabled={!editAmount || !editDueDate ||
                                (editDifferenceAction === 'create_extra' && !editExtraDueDate) ||
                                isEditSubmitting
                            }
                            className="rounded-xl font-black px-6 bg-green-600 hover:bg-green-700"
                            onClick={async () => {
                                if (!selectedInvoice) return;
                                setIsEditSubmitting(true);
                                try {
                                    // 1. Salvar edição (se mudou algo ou sempre pra garantir diff logic)
                                    const resEdit = await axios.patch(`/v1/financial/invoices/${selectedInvoice.id}/edit`, {
                                        amount: Number(editAmount),
                                        due_date: editDueDate,
                                        justification: editJustification + " (Edição antes da baixa)",
                                        difference_action: editDifferenceAction,
                                        extra_due_date: editDifferenceAction === 'create_extra' ? editExtraDueDate : undefined,
                                    });

                                    // 2. Dar baixa (O ID continua o mesmo, a não ser que tenha sido recriado no tiny, mas o local ID é o mesmo)
                                    await axios.patch(`/v1/financial/invoices/${selectedInvoice.id}/status`, {
                                        status: 'paid',
                                        payment_method: editPaymentMethod,
                                        justification: editJustification || 'Baixa manual e edição confirmadas',
                                    });

                                    if (resEdit.data.tiny_errors?.length > 0) {
                                        toast.success("Liquidado com ressalvas no Tiny ERP!");
                                        setTinyErrorsList(resEdit.data.tiny_errors);
                                        setTinyErrorsOpen(true);
                                    } else {
                                        toast.success("Fatura editada e liquidada com sucesso!");
                                    }
                                    
                                    refetch();
                                    queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
                                    setIsEditModalOpen(false);
                                } catch (error: any) {
                                    const msg = error?.response?.data?.message ?? "Erro ao concluir pagamento.";
                                    toast.error(msg);
                                } finally {
                                    setIsEditSubmitting(false);
                                }
                            }}
                        >
                            {isEditSubmitting ? "Processando..." : "Concluir Pagamento"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Settle Group Modal ───────────────────────── */}
            <Dialog open={isSettleModalOpen} onOpenChange={setIsSettleModalOpen}>
                <DialogContent className="sm:max-w-lg rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black flex items-center gap-2">
                            <Landmark className="text-purple-600" size={20} /> Quitação Antecipada
                        </DialogTitle>
                        <DialogDescription className="font-medium">
                            Quitar todas as parcelas pendentes deste grupo de uma vez.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Parcelas envolvidas */}
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Parcelas Pendentes a Quitar</p>
                            {settleGroupParcels.map(p => (
                                <div key={p.id} className="flex justify-between text-sm">
                                    <span className="text-gray-600 font-medium">Parcela {p.parcel_number}/{p.total_parcels} — Venc. {formatInvoiceDate(p.due_date)}</span>
                                    <span className="font-bold text-gray-900">R$ {Number(p.payable_amount ?? p.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            ))}
                            <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-gray-900">
                                <span>Total</span>
                                <span>R$ {settleGroupParcels.reduce((a, p) => a + Number(p.payable_amount ?? p.amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Desconto</label>
                                <Input
                                    type="number" min="0" step="0.01"
                                    placeholder="0"
                                    value={settleDiscount}
                                    onChange={e => setSettleDiscount(e.target.value)}
                                    className="rounded-xl border-gray-200"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tipo</label>
                                <Select value={settleDiscountType} onValueChange={(v: any) => setSettleDiscountType(v)}>
                                    <SelectTrigger className="rounded-xl border-gray-200 h-10 text-sm font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="fixed">R$ Fixo</SelectItem>
                                        <SelectItem value="percent">% Percentual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Forma de Pagamento</label>
                            <Select value={settlePaymentMethod} onValueChange={setSettlePaymentMethod}>
                                <SelectTrigger className="rounded-xl border-gray-200 h-10 text-sm font-bold"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="pix">PIX</SelectItem>
                                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                    <SelectItem value="cartao">Cartão</SelectItem>
                                    <SelectItem value="boleto">Boleto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Motivo / Observação (Obrigatório)</label>
                            <Textarea
                                placeholder="Ex: Cliente quitou antecipadamente com desconto de 10%..."
                                value={settleJustification}
                                onChange={e => setSettleJustification(e.target.value)}
                                className="min-h-[80px] rounded-2xl border-gray-200"
                            />
                        </div>

                        {/* Tiny ERP transparency panel */}
                        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-2">
                            <p className="text-xs font-black text-purple-700 uppercase tracking-widest flex items-center gap-2">
                                <Info size={14} /> O que será feito no Tiny ERP
                            </p>
                            <ul className="text-sm text-purple-900 space-y-1 list-disc list-inside">
                                <li><strong>{settleGroupParcels.filter(p => p.tiny_account_id).length}</strong> conta(s) a receber será(ão) baixada(s) no Tiny</li>
                                {settleGroupParcels.filter(p => !p.tiny_account_id).length > 0 && (
                                    <li className="text-amber-700">{settleGroupParcels.filter(p => !p.tiny_account_id).length} parcela(s) sem Tiny ID — serão quitadas apenas localmente</li>
                                )}
                                <li>Valor final após desconto: <strong>R$ {Math.max(0, settleGroupParcels.reduce((a, p) => a + Number(p.payable_amount ?? p.amount), 0) - (settleDiscount ? (settleDiscountType === 'percent' ? (settleGroupParcels.reduce((a, p) => a + Number(p.payable_amount ?? p.amount), 0) * Number(settleDiscount) / 100) : Number(settleDiscount)) : 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></li>
                            </ul>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button variant="secondary" onClick={() => setIsSettleModalOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                        <Button
                            disabled={settleJustification.length < 5 || isSettleSubmitting}
                            className="rounded-xl font-black px-8 bg-purple-600 hover:bg-purple-700"
                            onClick={async () => {
                                setIsSettleSubmitting(true);
                                try {
                                    const res = await axios.post(`/v1/financial/invoices/settle-group`, {
                                        group_id: settleGroupId,
                                        discount_value: settleDiscount ? Number(settleDiscount) : undefined,
                                        discount_type: settleDiscountType,
                                        payment_method: settlePaymentMethod,
                                        justification: settleJustification,
                                    });
                                    if (res.data.tiny_errors?.length > 0) {
                                        toast.success(res.data.message + " (com erros no Tiny — veja o log)");
                                    } else {
                                        toast.success(res.data.message);
                                    }
                                    refetch();
                                    setIsSettleModalOpen(false);
                                } catch (error: any) {
                                    const msg = error?.response?.data?.message ?? "Erro ao quitar parcelas.";
                                    toast.error(msg);
                                } finally {
                                    setIsSettleSubmitting(false);
                                }
                            }}
                        >
                            {isSettleSubmitting ? "Processando..." : "Confirmar Quitação"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Tiny ERP Errors Modal ───────────────────── */}
            <Dialog open={tinyErrorsOpen} onOpenChange={setTinyErrorsOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black flex items-center gap-2 text-orange-700">
                            <Info size={20} /> Erros de Sincronização com o Tiny
                        </DialogTitle>
                        <DialogDescription>
                            O sistema local foi atualizado com sucesso, mas houve falhas ao sincronizar com o Tiny ERP. Verifique os detalhes abaixo e tente novamente pelo botão “Reenviar ao Tiny” se necessário.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        {tinyErrorsList.map((err, idx) => (
                            <div key={idx} className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                <p className="text-sm text-red-800 font-medium">{err}</p>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setTinyErrorsOpen(false)} className="rounded-xl font-bold w-full">Entendido</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>



        </div>
    );
}
