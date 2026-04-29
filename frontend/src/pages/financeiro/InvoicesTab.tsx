import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
    RefreshCw,
    Pencil,
    Landmark,
    Info,
} from "lucide-react";
import { format, isBefore, startOfDay, subDays, isAfter } from "date-fns";
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
            celular?: string;
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
}

export default function InvoicesTab() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [syncFilter, setSyncFilter] = useState("all"); // all, synced, unsynced
    const [dateRange, setDateRange] = useState("all"); // all, 7, 15, 30, custom
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");

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

    const { data: invoices, isLoading, refetch } = useQuery<Invoice[]>({
        queryKey: ["financial-invoices"],
        queryFn: async () => {
            const response = await axios.get("/v1/financial/invoices");
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

    const filteredInvoices = invoices?.filter((invoice) => {
        const matchesSearch =
            invoice.client.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.client.cpf_cnpj?.includes(searchTerm) ||
            invoice.autorizacao_numero?.includes(searchTerm) ||
            (searchTerm && !isNaN(Number(searchTerm)) && invoice.autorizacao_numero?.includes(searchTerm.padStart(5, '0')));

        const isOverdue = invoice.status === "pending" && isBefore(new Date(invoice.due_date), startOfDay(new Date()));

        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "overdue" ? isOverdue : invoice.status === statusFilter);

        // Date Filtering
        let matchesDate = true;
        const invoiceDate = new Date(invoice.due_date);
        const today = startOfDay(new Date());

        if (dateRange === "7") {
            matchesDate = isAfter(invoiceDate, subDays(today, 7));
        } else if (dateRange === "15") {
            matchesDate = isAfter(invoiceDate, subDays(today, 15));
        } else if (dateRange === "30") {
            matchesDate = isAfter(invoiceDate, subDays(today, 30));
        } else if (dateRange === "custom") {
            const start = customStartDate ? startOfDay(new Date(customStartDate)) : null;
            const end = customEndDate ? startOfDay(new Date(customEndDate)) : null;
            if (start && end) {
                matchesDate = isAfter(invoiceDate, start) && isBefore(invoiceDate, end);
            } else if (start) {
                matchesDate = isAfter(invoiceDate, start);
            } else if (end) {
                matchesDate = isBefore(invoiceDate, end);
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
                        placeholder="Buscar por cliente ou CNPJ..."
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

                    {dateRange === "custom" && (
                        <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-300">
                            <Input
                                type="date"
                                className="w-32 h-9 rounded-xl border-gray-200 text-xs font-medium"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                            />
                            <span className="text-[10px] font-bold text-gray-400 uppercase">até</span>
                            <Input
                                type="date"
                                className="w-32 h-9 rounded-xl border-gray-200 text-xs font-medium"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
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
                                Plano
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                ERP
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
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
                        ) : filteredInvoices?.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    Nenhuma fatura encontrada.
                                </td>
                            </tr>
                        ) : (
                            filteredInvoices?.map((invoice) => {
                                const isOverdue = invoice.status === "pending" && isBefore(new Date(invoice.due_date), startOfDay(new Date()));

                                return (
                                    <tr key={invoice.id} className="hover:bg-gray-50">
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900">
                                                    {invoice.autorizacao_numero ? `#${invoice.autorizacao_numero}` : "-"}
                                                </span>
                                                {invoice.parcel_number && invoice.total_parcels && (
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                                                        Parcela {invoice.parcel_number}/{invoice.total_parcels}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button className="text-left group">
                                                        <div className="text-sm font-bold text-gray-900 group-hover:text-red-700 transition-colors flex items-center gap-1">
                                                            {invoice.client.nome_fantasia || invoice.client.razao_social}
                                                            <ChevronDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
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
                                                {format(new Date(invoice.due_date), "dd/MM/yyyy")}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                            {invoice.plan?.name || "-"}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            {getStatusBadge(invoice)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            {invoice.tiny_account_id ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                                    <Check size={10} /> Sincronizada
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-100">
                                                    <RefreshCw size={10} /> Pendente
                                                </span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
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
                                                        <button
                                                            onClick={() => {
                                                                setSelectedInvoice(invoice);
                                                                setEditAmount(String(invoice.payable_amount ?? invoice.amount));
                                                                setEditDueDate(invoice.due_date?.slice(0, 10) ?? "");
                                                                setEditJustification("");
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            className="p-2 text-blue-500 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Editar Valor / Vencimento"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>

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
                                                                setIsActionModalOpen(true);
                                                            }}
                                                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Dar Baixa (Marcar como Pago)"
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
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                        <div className="text-gray-500">
                            Mostrando <span className="font-bold text-gray-900">{filteredInvoices?.length || 0}</span> faturas
                        </div>
                        <div className="text-gray-500">
                            Total: <span className="font-bold text-gray-900">
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
                                        justification: justification || (actionType === 'paid' ? 'Baixa manual confirmada' : 'Cancelamento manual confirmado')
                                    });
                                    toast.success(actionType === 'paid' ? "Fatura liquidada!" : "Fatura cancelada.");
                                    refetch();
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
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Novo Vencimento</label>
                                <Input
                                    type="date" value={editDueDate}
                                    onChange={e => setEditDueDate(e.target.value)}
                                    className="rounded-xl border-gray-200 font-bold text-gray-900"
                                />
                            </div>
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
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Motivo da Alteração (Obrigatório)</label>
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

                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                        <Button
                            disabled={!editAmount || !editDueDate || editJustification.length < 5 ||
                                (editDifferenceAction === 'create_extra' && !editExtraDueDate) ||
                                isEditSubmitting
                            }
                            className="rounded-xl font-black px-8 bg-blue-600 hover:bg-blue-700"
                            onClick={async () => {
                                if (!selectedInvoice) return;
                                setIsEditSubmitting(true);
                                try {
                                    const res = await axios.patch(`/v1/financial/invoices/${selectedInvoice.id}/edit`, {
                                        amount: Number(editAmount),
                                        due_date: editDueDate,
                                        justification: editJustification,
                                        difference_action: editDifferenceAction,
                                        extra_due_date: editDifferenceAction === 'create_extra' ? editExtraDueDate : undefined,
                                    });
                                    if (res.data.tiny_errors?.length > 0) {
                                        toast.success(res.data.message);
                                        setTinyErrorsList(res.data.tiny_errors);
                                        setTinyErrorsOpen(true);
                                    } else {
                                        toast.success(res.data.message);
                                    }
                                    refetch();
                                    setIsEditModalOpen(false);
                                } catch (error: any) {
                                    const msg = error?.response?.data?.message ?? "Erro ao editar fatura.";
                                    toast.error(msg);
                                } finally {
                                    setIsEditSubmitting(false);
                                }
                            }}
                        >
                            {isEditSubmitting ? "Salvando..." : "Salvar Alterações"}
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
                                    <span className="text-gray-600 font-medium">Parcela {p.parcel_number}/{p.total_parcels} — Venc. {format(new Date(p.due_date + 'T12:00:00'), 'dd/MM/yyyy')}</span>
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
