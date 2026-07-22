import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/services/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    CreditCard,
    Plus,
    ExternalLink,
    Copy,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
    Printer,
    Tag,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Link as LinkIcon,
    Calendar,
    Smartphone,
    MoreHorizontal,
    Share2,
    Send,
    CheckCircle,
    DollarSign,
    ShieldCheck,
    Edit3,
    Trash2,
    AlertTriangle,
    Pencil,
    Landmark,
    Info,
    Check,
    Undo2,
    PenTool,
    User,
    Barcode
} from "lucide-react";
import { useFormikContext } from "formik";
import { cn } from "@/lib/utils";
import CreateAutorizacaoModal from "../../../financeiro/components/CreateAutorizacaoModal";
import PreviewAutorizacaoModal from "../../../financeiro/components/PreviewAutorizacaoModal";
import AssinaturaModal from "../../../financeiro/components/AssinaturaModal";
import EditAutorizacaoModal from "../../../financeiro/components/EditAutorizacaoModal";
import TransferAutorizacaoModal from "../../../financeiro/components/TransferAutorizacaoModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import { ExpressDatePicker } from "@/components/ui/ExpressDatePicker";

interface Plan {
    id: number;
    name: string;
    price: number;
    billing_cycle: string;
}

interface Invoice {
    id: number;
    amount: number;
    due_date: string;
    status: 'pending' | 'paid' | 'canceled';
    payment_url: string | null;
    payment_method?: string;
    parcel_number?: number;
    total_parcels?: number;
    group_id?: string;
    plan?: Plan;
    is_permuta?: boolean;
    permuta_amount?: number;
    payable_amount?: number;
    autorizacao_numero?: number;
    tiny_account_id?: string | null;
}

interface Autorizacao {
    id: number;
    numero: number;
    titulo_anuncio: string;
    valor_total: number;
    status: "rascunho" | "aguardando_assinatura" | "assinado" | "cancelado";
    data_inicio: string;
    data_fim: string;
}

export default function TabFinanceiro() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Form States
    const [selectedPlan, setSelectedPlan] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("boleto");
    const [installments, setInstallments] = useState(1);
    const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));

    // Autorização States
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isAssinaturaModalOpen, setIsAssinaturaModalOpen] = useState(false);
    const [selectedAuth, setSelectedAuth] = useState<{ id: number, numero: number } | null>(null);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [authToTransfer, setAuthToTransfer] = useState<Autorizacao | null>(null);

    // Payment Confirmation Modal States
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [invoiceToPay, setInvoiceToPay] = useState<number | null>(null);
    const [manualPaymentMethod, setManualPaymentMethod] = useState("pix");
    const [actionDate, setActionDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Edit Invoice Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [editAmount, setEditAmount] = useState("");
    const [editDueDate, setEditDueDate] = useState("");
    const [editJustification, setEditJustification] = useState("");
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);
    const [editDifferenceAction, setEditDifferenceAction] = useState<"discount" | "redistribute" | "create_extra" | "next_installment">("discount");
    const [editExtraDueDate, setEditExtraDueDate] = useState("");

    // Settle Group Modal States
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

    // Undo Payment States
    const [undoInvoiceId, setUndoInvoiceId] = useState<number | null>(null);
    const [settleGroupId, setSettleGroupId] = useState("");
    const [settleGroupParcels, setSettleGroupParcels] = useState<Invoice[]>([]);
    const [settleDiscount, setSettleDiscount] = useState("");
    const [settleDiscountType, setSettleDiscountType] = useState<"fixed" | "percent">("fixed");
    const [settlePaymentMethod, setSettlePaymentMethod] = useState("pix");
    const [settleJustification, setSettleJustification] = useState("");
    const [isSettleSubmitting, setIsSettleSubmitting] = useState(false);

    // Tiny Errors Modal
    const [tinyErrorsOpen, setTinyErrorsOpen] = useState(false);
    const [tinyErrorsList, setTinyErrorsList] = useState<string[]>([]);

    // Discount States
    const [showDiscount, setShowDiscount] = useState(false);
    const [discountValue, setDiscountValue] = useState(0);
    const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");

    // Permuta States
    const [isPermuta, setIsPermuta] = useState(false);
    const [permutaAmount, setPermutaAmount] = useState<number>(0);
    const [permutaDescription, setPermutaDescription] = useState("");

    const [isWarningOpen, setIsWarningOpen] = useState(false);

    // Multi-select state
    const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
    const [isBulkSettleModalOpen, setIsBulkSettleModalOpen] = useState(false);

    // Fetch Invoices
    const { data: invoices, isLoading: isLoadingInvoices, refetch: refetchInvoices } = useQuery<Invoice[]>({
        queryKey: ["client-invoices", id],
        queryFn: async () => {
            const resp = await axios.get(`/v1/clientes/${id}/invoices`);
            return resp.data;
        },
    });

    const { data: autorizacoes, isLoading: isLoadingAuths, refetch: refetchAuths } = useQuery<Autorizacao[]>({
        queryKey: ["client-autorizacoes", id],
        queryFn: async () => {
            const resp = await axios.get("/v1/autorizacoes", { params: { cliente_id: id } });
            return resp.data.data;
        },
    });

    // Auto-open preview if auth_id is in URL
    useEffect(() => {
        const authIdParam = searchParams.get("auth_id");
        if (authIdParam && autorizacoes && autorizacoes.length > 0) {
            const targetAuth = autorizacoes.find(a => String(a.id) === authIdParam);
            if (targetAuth) {
                setSelectedAuth({ id: targetAuth.id, numero: targetAuth.numero });
                setIsPreviewOpen(true);
                // Clear the parameter to avoid re-opening if user navigates back
                // window.history.replaceState({}, '', window.location.pathname + window.location.search.replace(/&?auth_id=[^&]*/, ''));
            }
        }
    }, [searchParams, autorizacoes]);

    const [isEditAuthOpen, setIsEditAuthOpen] = useState(false);
    const [authToEdit, setAuthToEdit] = useState<any>(null);
    const [isDeleteAuthModalOpen, setIsDeleteAuthModalOpen] = useState(false);
    const [authIdToDelete, setAuthIdToDelete] = useState<number | null>(null);

    const deleteAuthMutation = useMutation({
        mutationFn: async (authId: number) => {
            await axios.delete(`/v1/autorizacoes/${authId}`);
        },
        onSuccess: () => {
            toast.success("Autorização e faturas excluídas!");
            refetchAuths();
            queryClient.invalidateQueries({ queryKey: ["client-invoices", id] });
            queryClient.invalidateQueries({ queryKey: ["financial-invoices"] });
            queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Erro ao excluir autorização.");
        }
    });

    // Fetch Plans
    const { data: plans } = useQuery<Plan[]>({
        queryKey: ["plans"],
        queryFn: async () => {
            const resp = await axios.get("/v1/plans");
            return resp.data;
        },
    });

    // Create Invoice Mutation
    const createInvoiceMutation = useMutation({
        mutationFn: async (payload: {
            plan_id: string;
            due_date: string;
            installments: number;
            payment_method: string;
            discount_value?: number;
            discount_type?: string;
            is_permuta?: boolean;
            permuta_amount?: number;
            permuta_description?: string;
        }) => {
            const resp = await axios.post(`/v1/clientes/${id}/invoices`, payload);
            return resp.data;
        },
        onSuccess: () => {
            toast.success("Cobrança(s) gerada(s) com sucesso!");
            queryClient.invalidateQueries({ queryKey: ["client-invoices", id] });
            queryClient.invalidateQueries({ queryKey: ["financial-invoices"] });
            queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
            queryClient.refetchQueries({ queryKey: ["client-invoices", id] });
            setIsModalOpen(false);
            setInstallments(1);
            setIsPermuta(false);
            setPermutaAmount(0);
            setPermutaDescription("");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Erro ao gerar cobrança.");
        },
    });
    
    // Mutation para Dar Baixa (Pago)
    const payInvoiceMutation = useMutation({
        mutationFn: async (invoiceId: number) => {
            const resp = await axios.patch(`/v1/financial/invoices/${invoiceId}/status`, {
                status: 'paid',
                payment_method: manualPaymentMethod,
                action_date: actionDate,
                justification: `Baixa manual confirmada pelo administrador via ${manualPaymentMethod}`
            });
            return resp.data;
        },
        onSuccess: () => {
            toast.success("Fatura liquidada com sucesso! Sincronizado com Tiny ERP.");
            queryClient.invalidateQueries({ queryKey: ["client-invoices", id] });
            queryClient.invalidateQueries({ queryKey: ["cliente-hub", id] });
            queryClient.invalidateQueries({ queryKey: ["cliente", Number(id)] });
            queryClient.invalidateQueries({ queryKey: ["financial-invoices"] });
            queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Erro ao dar baixa na fatura.");
        }
    });

    const handleMarkAsPaid = (invoiceId: number) => {
        setInvoiceToPay(invoiceId);
        setActionDate(format(new Date(), 'yyyy-MM-dd'));
        setIsPayModalOpen(true);
    };

    const handleGenerateInvoice = (e?: React.MouseEvent | React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (!selectedPlan) {
            toast.error("Por favor, selecione um plano primeiro.");
            return;
        }

        if (isPermuta && permutaDescription.trim().length === 0) {
            toast.error("Por favor, descreva os detalhes da permuta.");
            return;
        }

        console.log("🚀 [Invoice] Iniciando geração:", {
            plan_id: selectedPlan,
            due_date: dueDate,
            installments: installments,
            client_id: id
        });

        createInvoiceMutation.mutate({
            plan_id: selectedPlan,
            due_date: dueDate,
            installments: installments,
            payment_method: paymentMethod,
            discount_value: discountValue,
            discount_type: discountType,
            is_permuta: isPermuta,
            permuta_amount: isPermuta ? permutaAmount : undefined,
            permuta_description: isPermuta ? permutaDescription : undefined
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Link copiado!");
    };

    const handleDownloadCarnet = async (groupId: string) => {
        try {
            const response = await axios.get(`/v1/financial/group/${groupId}/carnet`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Carne_O_Vermelhinho_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Erro ao baixar carnê.");
        }
    };

    const handleDownloadReceipt = async (invoiceId: number) => {
        try {
            const loadingToast = toast.loading("Gerando recibo...");
            const response = await axios.get(`/v1/financial/invoices/${invoiceId}/receipt`, {
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

    const handleUndoPayment = async () => {
        if (!undoInvoiceId) return;
        try {
            const loadingToast = toast.loading("Desfazendo pagamento...");
            await axios.patch(`/v1/financial/invoices/${undoInvoiceId}/status`, {
                status: 'pending',
                justification: 'Desfeito pelo painel administrativo (Gestão Financeira)'
            });
            toast.success("Pagamento desfeito com sucesso!", { id: loadingToast });
            setUndoInvoiceId(null);
            queryClient.invalidateQueries({ queryKey: ["client-invoices", id] });
            queryClient.invalidateQueries({ queryKey: ["financial-invoices"] });
            queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
        } catch (error) {
            console.error("Erro ao desfazer pagamento:", error);
            toast.error("Erro ao desfazer pagamento.");
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
            link.setAttribute('download', `Recibos_Lote_${id}_${format(new Date(), 'ddMMyyHHmm')}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Download iniciado!", { id: loadingToast });
            setSelectedInvoices([]);
        } catch (error) {
            toast.error("Erro ao gerar download em lote.");
        }
    };

    const handleBulkMarkAsPaid = async () => {
        if (selectedInvoices.length === 0) return;

        try {
            const loadingToast = toast.loading("Processando baixa em lote...");
            await axios.post(`/v1/financial/invoices/settle-batch`, {
                ids: selectedInvoices,
                payment_method: 'pix',
                justification: "Baixa em lote realizada pelo administrativo."
            });
            toast.success("Baixa em lote concluída!", { id: loadingToast });
            setSelectedInvoices([]);
            setIsBulkSettleModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["client-invoices", id] });
            queryClient.invalidateQueries({ queryKey: ["cliente-hub", id] });
            queryClient.invalidateQueries({ queryKey: ["cliente", Number(id)] });
            queryClient.invalidateQueries({ queryKey: ["financial-invoices"] });
            queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
        } catch (error) {
            toast.error("Erro ao realizar baixa em lote.");
        }
    };

    const toggleSelectInvoice = (id: number) => {
        setSelectedInvoices(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedInvoices.length === invoices?.length) {
            setSelectedInvoices([]);
        } else {
            setSelectedInvoices(invoices?.map(i => i.id) || []);
        }
    };

    const getStatusBadge = (status: string, dueDate?: string) => {
        const isOverdue = status === "pending" && dueDate && new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

        if (isOverdue) {
            return (
                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700 shadow-sm animate-pulse">
                    <AlertCircle size={12} /> Atrasado
                </span>
            );
        }

        switch (status) {
            case "paid":
                return (
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700 shadow-sm">
                        <CheckCircle2 size={12} /> Pago
                    </span>
                );
            case "pending":
                return (
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-black uppercase bg-yellow-100 text-yellow-700 shadow-sm">
                        <Clock size={12} /> Pendente
                    </span>
                );
            case "canceled":
                return (
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700 shadow-sm">
                        <AlertCircle size={12} /> Cancelado
                    </span>
                );
        }
    };

    const getAuthStatusBadge = (status: string) => {
        switch (status) {
            case "assinado":
                return (
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700 shadow-sm">
                        <CheckCircle size={12} /> Assinado
                    </span>
                );
            case "aguardando_assinatura":
                return (
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-black uppercase bg-yellow-100 text-yellow-700 shadow-sm animate-pulse">
                        <Clock size={12} /> Aguardando
                    </span>
                );
            case "cancelado":
                return (
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-700 shadow-sm">
                        <AlertCircle size={12} /> Cancelado
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 shadow-sm">
                        <FileText size={12} /> Rascunho
                    </span>
                );
        }
    };

    const handleSendLink = async (authId: number) => {
        try {
            const response = await axios.post(`/v1/autorizacoes/${authId}/send-link`);
            const link = response.data.link;

            if (link) {
                navigator.clipboard.writeText(link);
                toast.success("Link copiado para o clipboard!", { icon: "📋" });
            } else {
                toast.success("Link gerado com sucesso!");
            }

            refetchAuths();
        } catch (error) {
            toast.error("Erro ao enviar link.");
        }
    };

    const handleGenerateInvoicesManual = async (authId: number) => {
        const loadingToast = toast.loading("Comunicando com Tiny ERP e gerando faturas...");
        try {
            const resp = await axios.post(`/v1/autorizacoes/${authId}/generate-invoices`);
            toast.success(`Sucesso! ${resp.data.invoices_criadas} faturas geradas.`, { id: loadingToast });
            queryClient.invalidateQueries({ queryKey: ["client-invoices", id] });
            queryClient.invalidateQueries({ queryKey: ["financial-invoices"] });
            queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
            refetchAuths();
        } catch (error: any) {
            const msg = error.response?.data?.message || "Erro ao gerar faturas.";
            toast.error(msg, { id: loadingToast });
        }
    };

    const selectedPlanData = plans?.find(p => String(p.id) === selectedPlan);

    const calculateTotals = () => {
        if (!selectedPlanData) return { total: 0, discount: 0, finalBase: 0, permuta: 0, finalPayable: 0, parcel: 0 };

        const basePrice = Number(selectedPlanData.price);
        const discount = discountType === "fixed"
            ? discountValue
            : (basePrice * discountValue) / 100;

        const finalBase = Math.max(0, basePrice - discount);
        const permuta = isPermuta ? Number(permutaAmount || 0) : 0;
        const finalPayable = Math.max(0, finalBase - permuta);
        const parcel = finalPayable / installments;

        return {
            total: basePrice,
            discount,
            finalBase, // Valor após desconto, mas antes da permuta
            permuta,
            finalPayable, // Valor real que será cobrado (pode ser 0 se for 100% permuta)
            parcel
        };
    };

    const totals = calculateTotals();
    const { values, setFieldValue } = useFormikContext<any>();
    const [magicLink, setMagicLink] = useState("");
    const generateRenewalLinkMutation = useMutation({
        mutationFn: async () => {
            const resp = await axios.post(`/v1/renewals/generate-link`, {
                cliente_id: id,
                expiration_date: values.contract_ends_at
            });
            return resp.data;
        },
        onSuccess: (data) => {
            setMagicLink(data.magic_link);
            copyToClipboard(data.magic_link);
            toast.success("Link de renovação gerado e copiado!");
        },
        onError: (error: any) => {
            toast.error("Erro ao gerar link de renovação.");
        }
    });

    const openWhatsApp = (link: string) => {
        const nome = values.nome_fantasia || "Cliente";
        const msg = `Olá ${nome}, identificamos que seu contrato está próximo do vencimento. Para sua comodidade, você pode confirmar seus dados e renovar por este link seguro: ${link}`;

        // Prioridade para o celular, depois telefone principal
        const foneRaw = values.celular || values.telefone_principal || "";
        const fone = foneRaw.replace(/\D/g, "");

        if (!fone) {
            toast.error("Cliente sem telefone ou celular cadastrado.");
            return;
        }

        const url = `https://wa.me/55${fone}?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank");
    };

    return (
        <div className="space-y-6">
            {/* Seção de Renovação */}
            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6 mb-6">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded-xl text-red-600">
                                <RefreshCw size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">Renovação de Contrato</h4>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Configure o vencimento e envie o link ao cliente</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-48">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="date"
                                    value={values.contract_ends_at || ""}
                                    onChange={(e) => setFieldValue("contract_ends_at", e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 bg-white border-gray-200 rounded-xl text-sm font-semibold focus:ring-red-500 focus:border-red-500 transition-all"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => generateRenewalLinkMutation.mutate()}
                                disabled={generateRenewalLinkMutation.isPending}
                                className="flex items-center justify-center gap-2 px-6 py-2 bg-[#B70F0A] text-white rounded-xl hover:bg-[#8e0c08] transition-all font-bold text-sm shadow-sm whitespace-nowrap"
                            >
                                {generateRenewalLinkMutation.isPending ? (
                                    <RefreshCw className="animate-spin" size={16} />
                                ) : (
                                    <LinkIcon size={16} />
                                )}
                                {magicLink ? "Regerar Link" : "Gerar Link"}
                            </button>
                        </div>
                    </div>

                    {magicLink && (
                        <div className="flex items-center gap-2 p-1.5 bg-white border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-1 duration-300">
                            <div className="flex-1 px-3 py-1.5 bg-gray-50 rounded-lg overflow-hidden flex items-center">
                                <LinkIcon size={14} className="text-gray-400 mr-2 shrink-0" />
                                <input
                                    readOnly
                                    value={magicLink}
                                    className="w-full bg-transparent border-none text-[11px] font-medium text-gray-500 focus:ring-0 cursor-default"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => openWhatsApp(magicLink)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-bold text-[10px] uppercase"
                            >
                                <Smartphone size={13} />
                                Enviar Whats
                            </button>
                            <button
                                type="button"
                                onClick={() => copyToClipboard(magicLink)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-bold text-[10px] uppercase"
                            >
                                <Copy size={13} />
                                Copiar Link
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Nova Seção: Contratos (Autorizações) */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FileText className="text-red-600" size={20} />
                            Autorizações
                        </h3>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-tight text-[10px]">Gestão de contratos e assinaturas digitais.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsAuthModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors font-bold text-xs shadow-sm"
                    >
                        <Plus size={18} />
                        Gerar Autorização
                    </button>
                </div>

                <div className="overflow-hidden border border-gray-100 rounded-2xl bg-white shadow-sm">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-[10px] text-gray-400 uppercase font-black bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Nº Autorização</th>
                                <th className="px-6 py-4">Veiculação</th>
                                <th className="px-6 py-4">Investimento</th>
                                <th className="px-6 py-4">Vigência</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoadingAuths ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center animate-pulse">Carregando...</td></tr>
                            ) : autorizacoes?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic font-medium">
                                        Nenhuma autorização gerada para este cliente.
                                    </td>
                                </tr>
                            ) : (
                                [...autorizacoes]?.sort((a, b) => {
                                    const numA = parseInt(a.numero.toString().split('-')[0], 10) || 0;
                                    const numB = parseInt(b.numero.toString().split('-')[0], 10) || 0;
                                    return numB - numA;
                                }).map((auth) => (
                                    <tr key={auth.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-black text-gray-900">
                                            {auth.numero.toString().padStart(5, '0')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-gray-600">
                                                {auth.titulo_anuncio}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-black text-gray-900">
                                            R$ {Number(auth.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-semibold text-gray-400">
                                            {format(new Date(auth.data_inicio), "dd/MM/yy")} - {format(new Date(auth.data_fim), "dd/MM/yy")}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getAuthStatusBadge(auth.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                        <MoreHorizontal size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-gray-100 p-1">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedAuth({ id: auth.id, numero: auth.numero });
                                                            setIsPreviewOpen(true);
                                                        }}
                                                        className="rounded-lg font-bold text-xs gap-2 py-2 cursor-pointer"
                                                    >
                                                        <Printer size={14} className="text-gray-400" /> Visualizar PDF
                                                    </DropdownMenuItem>

                                                    {['rascunho', 'aguardando_assinatura'].includes(auth.status) && (
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedAuth({ id: auth.id, numero: auth.numero });
                                                                setIsAssinaturaModalOpen(true);
                                                            }}
                                                            className="rounded-lg font-bold text-xs gap-2 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 cursor-pointer mb-1"
                                                        >
                                                            <PenTool size={14} /> Assinar
                                                        </DropdownMenuItem>
                                                    )}

                                                    {auth.status === "assinado" && !auth.has_invoices && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleGenerateInvoicesManual(auth.id)}
                                                            className="rounded-lg font-bold text-xs gap-2 py-2 text-emerald-600 bg-emerald-50 cursor-pointer"
                                                        >
                                                            <DollarSign size={14} /> Gerar Faturas Tiny
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuSeparator className="bg-gray-50" />

                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setAuthToTransfer(auth);
                                                            setIsTransferModalOpen(true);
                                                        }}
                                                        className="rounded-lg font-bold text-xs gap-2 py-2 text-purple-600 hover:bg-purple-50 cursor-pointer"
                                                    >
                                                        <User size={14} /> Transferir Venda
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setAuthToEdit(auth);
                                                            setIsEditAuthOpen(true);
                                                        }}
                                                        className="rounded-lg font-bold text-xs gap-2 py-2 text-blue-700 hover:bg-blue-50 cursor-pointer"
                                                    >
                                                        <Edit3 size={14} /> Editar Contrato
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setAuthIdToDelete(auth.id);
                                                            setIsDeleteAuthModalOpen(true);
                                                        }}
                                                        className="rounded-lg font-bold text-xs gap-2 py-2 text-red-600 hover:bg-red-50 cursor-pointer font-black"
                                                    >
                                                        <Trash2 size={14} /> Excluir Definitivamente
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
            </div>

            <div className="h-px bg-gray-100 my-4" />

            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <CreditCard className="text-[#B70F0A]" size={20} />
                        Gestão Financeira
                    </h3>
                    <p className="text-sm text-gray-500">Histórico de faturas e cobranças do cliente.</p>
                </div>
                
                {selectedInvoices.length > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                        <span className="text-[10px] font-black uppercase text-gray-400 mr-2">
                            {selectedInvoices.length} selecionado(s)
                        </span>
                        <button
                            onClick={handleBulkDownloadReceipts}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors font-bold text-[10px] uppercase border border-emerald-100"
                        >
                            <Printer size={14} />
                            Recibos em Lote
                        </button>
                        <button
                            onClick={() => setIsBulkSettleModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-bold text-[10px] uppercase border border-blue-100"
                        >
                            <CheckCircle2 size={14} />
                            Baixar em Lote (Pago)
                        </button>
                        <button
                            onClick={() => setSelectedInvoices([])}
                            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Limpar seleção"
                        >
                            <Plus size={14} className="rotate-45" />
                        </button>
                    </div>
                )}
            </div>

            {isLoadingInvoices ? (
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-100 rounded"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                </div>
            ) : (
                <div className="overflow-hidden border border-gray-200 rounded-2xl shadow-sm">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-[11px] text-gray-400 uppercase font-black bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={invoices?.length! > 0 && selectedInvoices.length === invoices?.length}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer h-4 w-4"
                                    />
                                </th>
                                <th className="px-4 py-4">Fatura</th>
                                <th className="hidden md:table-cell px-6 py-4">Vencimento</th>
                                <th className="px-4 py-4">Valor</th>
                                <th className="hidden md:table-cell px-6 py-4">Método</th>
                                <th className="hidden md:table-cell px-6 py-4">Status</th>
                                <th className="px-4 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoices && invoices.length > 0 ? (
                                [...invoices]
                                    .sort((a, b) => {
                                        const authA = a.autorizacao_numero ? parseInt(String(a.autorizacao_numero), 10) : 0;
                                        const authB = b.autorizacao_numero ? parseInt(String(b.autorizacao_numero), 10) : 0;
                                        if (authA !== authB) return authB - authA;

                                        const parcA = Number(a.parcel_number) || 0;
                                        const parcB = Number(b.parcel_number) || 0;
                                        if (parcA !== parcB) return parcB - parcA;

                                        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
                                    })
                                    .map((invoice) => (
                                        <tr key={invoice.id} className={cn(
                                            "bg-white hover:bg-gray-50/80 transition-colors group",
                                            selectedInvoices.includes(invoice.id) && "bg-red-50/30"
                                        )}>
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedInvoices.includes(invoice.id)}
                                                onChange={() => toggleSelectInvoice(invoice.id)}
                                                className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer h-4 w-4"
                                            />
                                        </td>
                                        <td className="px-4 py-4 font-medium text-gray-900">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold">
                                                        {invoice.autorizacao_numero 
                                                            ? `${invoice.autorizacao_numero.toString().padStart(5, '0')}/${invoice.parcel_number}` 
                                                            : `#${invoice.id}`}
                                                    </span>
                                                    {!invoice.autorizacao_numero && invoice.total_parcels && invoice.total_parcels > 1 && (
                                                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase">
                                                            {invoice.parcel_number}/{invoice.total_parcels}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                    {invoice.plan?.name || "Avulso"}
                                                </span>
                                                <div className="md:hidden mt-2 text-[10px] text-gray-500 font-medium">
                                                    Venc: {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                                                </div>
                                                <div className="md:hidden mt-1">
                                                    {getStatusBadge(invoice.status, invoice.due_date)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 text-gray-600">
                                            {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    R$ {Number(invoice.payable_amount ?? invoice.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                                {invoice.amount !== undefined && invoice.payable_amount !== undefined && Number(invoice.payable_amount) < Number(invoice.amount) && Number(invoice.payable_amount) > 0 && (
                                                    <span className="text-[10px] text-gray-500 font-medium mt-0.5 max-w-[120px] leading-tight">
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
                                        <td className="hidden md:table-cell px-6 py-4">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">
                                                {invoice.payment_method || 'boleto'}
                                            </span>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4">
                                            {getStatusBadge(invoice.status, invoice.due_date)}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-center gap-1.5">
                                                {invoice.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedInvoice(invoice);
                                                                setEditAmount(String(invoice.payable_amount ?? invoice.amount));
                                                                setEditDueDate(invoice.due_date?.slice(0, 10) ?? "");
                                                                setEditJustification("");
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                            title="Editar Valor / Vencimento"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>


                                                        <button
                                                            onClick={() => handleMarkAsPaid(invoice.id)}
                                                            disabled={payInvoiceMutation.isPending}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all disabled:opacity-50"
                                                            title="Dar Baixa (Confirmar Pagamento)"
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                
                                                {invoice.payment_url && (
                                                    <>
                                                        <button
                                                            onClick={() => copyToClipboard(invoice.payment_url!)}
                                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                                                            title="Copiar Link"
                                                        >
                                                            <Copy size={16} />
                                                        </button>
                                                        <a
                                                            href={invoice.payment_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 text-[#B70F0A] hover:bg-red-50 rounded-xl transition-all"
                                                            title="Ver Boleto/Pix"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </a>
                                                    </>
                                                )}

                                                <button
                                                    onClick={() => handleDownloadReceipt(invoice.id)}
                                                    className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                                                    title="Imprimir Recibo de Pagamento"
                                                >
                                                    <Printer size={16} />
                                                </button>

                                                {invoice.status === 'paid' && (
                                                    <button
                                                        onClick={() => setUndoInvoiceId(invoice.id)}
                                                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                                                        title="Desfazer Pagamento"
                                                    >
                                                        <Undo2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText size={42} strokeWidth={1} className="opacity-20" />
                                            <p className="text-sm">Nenhuma fatura encontrada para este cliente.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Gerar Cobrança */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-[#B70F0A] p-8 text-white relative">
                            <h3 className="text-2xl font-bold mb-1">Nova Cobrança</h3>
                            <p className="text-red-100 text-sm opacity-80 leading-tight">Configurações de plano e parcelamento.</p>
                            <div className="absolute top-8 right-8 bg-red-800/30 p-2 rounded-2xl">
                                <Plus size={24} />
                            </div>
                        </div>

                        <div className="p-8 space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Plano / Serviço
                                    </label>
                                    <select
                                        value={selectedPlan}
                                        onChange={(e) => setSelectedPlan(e.target.value)}
                                        className="w-full h-12 bg-gray-50 border-gray-100 rounded-2xl focus:ring-[#B70F0A] focus:border-[#B70F0A] transition-all font-semibold px-4"
                                        required
                                    >
                                        <option value="">Selecione um plano...</option>
                                        {plans?.map((plan) => (
                                            <option key={plan.id} value={plan.id}>
                                                {plan.name} - R$ {Number(plan.price).toLocaleString('pt-BR')}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                            Vencimento (1ª)
                                        </label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="w-full h-12 bg-gray-50 border-gray-100 rounded-2xl focus:ring-[#B70F0A] focus:border-[#B70F0A] transition-all font-semibold px-4"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                            Parcelas
                                        </label>
                                        <select
                                            value={installments}
                                            onChange={(e) => setInstallments(Number(e.target.value))}
                                            className="w-full h-12 bg-gray-50 border-gray-100 rounded-2xl focus:ring-[#B70F0A] focus:border-[#B70F0A] transition-all font-semibold px-4"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                                <option key={n} value={n}>{n}x</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Forma de Recebimento
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("boleto")}
                                            className={cn(
                                                "py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2",
                                                paymentMethod === "boleto"
                                                    ? "bg-red-50 border-[#B70F0A] text-[#B70F0A]"
                                                    : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                                            )}
                                        >
                                            Boleto
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("pix")}
                                            className={cn(
                                                "py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2",
                                                paymentMethod === "pix"
                                                    ? "bg-red-50 border-[#B70F0A] text-[#B70F0A]"
                                                    : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                                            )}
                                        >
                                            Pix
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("cartao")}
                                            className={cn(
                                                "py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2",
                                                paymentMethod === "cartao"
                                                    ? "bg-red-50 border-[#B70F0A] text-[#B70F0A]"
                                                    : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                                            )}
                                        >
                                            Cartão
                                        </button>
                                    </div>
                                </div>

                                {/* Discount Section */}
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => setShowDiscount(!showDiscount)}
                                        className="flex items-center gap-2 text-[10px] font-black text-[#B70F0A] uppercase tracking-widest mb-2 ml-1 hover:opacity-80 transition-all"
                                    >
                                        <Tag size={12} />
                                        {showDiscount ? "Remover Desconto" : "Aplicar Desconto?"}
                                        {showDiscount ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>

                                    {showDiscount && (
                                        <div className="flex gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-top-2 duration-200">
                                            <div className="flex-1">
                                                <input
                                                    type="number"
                                                    value={discountValue}
                                                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                                                    placeholder="Valor"
                                                    className="w-full h-10 bg-white border-gray-100 rounded-xl focus:ring-[#B70F0A] focus:border-[#B70F0A] text-sm font-bold px-3"
                                                />
                                            </div>
                                            <div className="flex bg-white rounded-xl border border-gray-100 p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setDiscountType("fixed")}
                                                    className={cn(
                                                        "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                                                        discountType === "fixed" ? "bg-[#B70F0A] text-white" : "text-gray-400"
                                                    )}
                                                >
                                                    R$
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDiscountType("percent")}
                                                    className={cn(
                                                        "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                                                        discountType === "percent" ? "bg-[#B70F0A] text-white" : "text-gray-400"
                                                    )}
                                                >
                                                    %
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Permuta Section */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Pagamento com Permuta?
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsPermuta(!isPermuta)}
                                        className={cn(
                                            "w-11 h-6 rounded-full transition-colors relative",
                                            isPermuta ? "bg-[#B70F0A]" : "bg-gray-200"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                                                isPermuta ? "translate-x-5" : "translate-x-0"
                                            )}
                                        />
                                    </button>
                                </div>

                                {isPermuta && (
                                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                                        <div>
                                            <div className="flex bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                                <span className="flex items-center justify-center px-4 bg-gray-100 text-gray-400 text-sm font-bold border-r border-gray-100">
                                                    R$
                                                </span>
                                                <input
                                                    type="number"
                                                    value={permutaAmount || ""}
                                                    onChange={(e) => setPermutaAmount(Number(e.target.value))}
                                                    placeholder="Valor em permuta"
                                                    className="w-full h-12 bg-transparent border-none focus:ring-0 text-sm font-bold px-3"
                                                    min={0}
                                                    max={totals.finalBase} // Não pode ser maior que o valor total após desconto
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <textarea
                                                value={permutaDescription}
                                                onChange={(e) => setPermutaDescription(e.target.value)}
                                                placeholder="Descreva o que foi permutado. Ex: 2 vouchers de jantar"
                                                className="w-full min-h-[80px] bg-gray-50 border border-gray-100 rounded-2xl focus:ring-[#B70F0A] focus:border-[#B70F0A] text-sm font-medium px-4 py-3"
                                                required={isPermuta}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedPlanData && (
                            <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 mt-2">
                                <div className="flex justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-tighter mb-2">
                                    <span>Resumo da Cobrança</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="pt-2 space-y-2">
                                        <div className="flex justify-between text-[11px] font-bold text-slate-400">
                                            <span>Subtotal (Plano)</span>
                                            <span>R$ {totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>

                                        {totals.discount > 0 && (
                                            <div className="flex justify-between text-[11px] font-bold text-green-500">
                                                <span>Desconto</span>
                                                <span>- R$ {totals.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        )}

                                        {isPermuta && totals.permuta > 0 && (
                                            <div className="flex justify-between text-[11px] font-bold text-orange-500">
                                                <span>Permuta (Abatido)</span>
                                                <span>- R$ {totals.permuta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-3 border-t border-slate-200/50">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[12px] font-black uppercase text-slate-500 tracking-tighter">Liquidado via Permuta</span>
                                            <span className="text-sm font-black text-orange-600">R$ {totals.permuta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-red-50 rounded-2xl border border-red-100/50">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[12px] font-black text-red-800 uppercase tracking-tighter">A Receber (Dinheiro)</span>
                                            <span className="text-xl font-black text-[#B70F0A]">R$ {totals.finalPayable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        {totals.finalPayable > 0 && installments > 1 && (
                                            <p className="text-[10px] font-bold text-red-600/70 text-right">
                                                Em {installments}x de R$ {totals.parcel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        )}
                                        {totals.finalPayable === 0 && isPermuta && (
                                            <div className="mt-2 flex items-center justify-center gap-1.5 p-2 bg-green-100 text-green-800 rounded-xl text-[10px] font-black uppercase">
                                                <CheckCircle2 size={12} />
                                                Plano pago 100% em Permuta
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="px-8 pb-8 pt-4">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 h-14 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 font-black uppercase text-xs transition-all"
                                >
                                    Voltar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGenerateInvoice}
                                    disabled={createInvoiceMutation.isPending}
                                    className="flex-[2] h-14 bg-[#B70F0A] text-white rounded-2xl hover:bg-[#8e0c08] font-black uppercase text-[10px] sm:text-xs transition-all disabled:opacity-50 shadow-lg shadow-red-200 flex items-center justify-center gap-1.5"
                                >
                                    {createInvoiceMutation.isPending
                                        ? "Processando..."
                                        : (totals.finalPayable === 0 && isPermuta)
                                            ? "Confirmar Permuta e Ativar"
                                            : "Gerar Link de Pagamento"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <CreateAutorizacaoModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onSuccess={() => {
                    refetchAuths();
                    setIsAuthModalOpen(false);
                }}
                initialClientId={Number(id)}
            />

            <PreviewAutorizacaoModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                autorizacaoId={selectedAuth?.id || null}
                numero={selectedAuth?.numero || null}
            />

            <AssinaturaModal
                isOpen={isAssinaturaModalOpen}
                onClose={() => setIsAssinaturaModalOpen(false)}
                onSuccess={() => {
                    refetchAuths();
                    queryClient.invalidateQueries({ queryKey: ["client-invoices", id] });
                    queryClient.invalidateQueries({ queryKey: ["financial-invoices"] });
            queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
                    setIsAssinaturaModalOpen(false);
                }}
                autorizacaoId={selectedAuth?.id || null}
                numero={selectedAuth?.numero || null}
            />

            {/* Aviso de Duplicidade Elegante */}
            <AlertDialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
                <AlertDialogContent className="rounded-[32px] border-none p-8 max-w-md shadow-2xl">
                    <AlertDialogHeader className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4">
                            <AlertCircle size={32} />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-gray-900 tracking-tight">
                            Atenção: Pendências
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 font-medium px-4 mt-2 leading-relaxed">
                            Este cliente já possui autorizações aguardando assinatura. Gerar uma cobrança agora pode causar <strong className="text-red-600">duplicidade</strong> no financeiro.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
                        <AlertDialogCancel className="flex-1 h-12 rounded-2xl border-gray-100 font-bold text-gray-400 hover:bg-gray-50 transition-all uppercase text-[10px]">
                            Voltar e Revisar
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => {
                                setIsWarningOpen(false);
                                setIsModalOpen(true);
                            }}
                            className="flex-1 h-12 rounded-2xl bg-[#B70F0A] hover:bg-[#8e0c08] font-black text-white shadow-lg shadow-red-200 transition-all uppercase text-[10px]"
                        >
                            Prosseguir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal de Confirmação de Pagamento Elegante */}
            <AlertDialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
                <AlertDialogContent className="rounded-[32px] border-none p-8 max-w-md shadow-2xl">
                    <AlertDialogHeader className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                            <DollarSign size={42} />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-gray-900 tracking-tight">
                            Confirmar Pagamento?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 font-medium px-4 mt-2">
                            Selecione o método utilizado e confirme a liquidação da fatura.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="grid grid-cols-4 gap-2 mt-6 px-2">
                        {[
                            { id: 'pix', label: 'Pix', icon: <Smartphone size={14} /> },
                            { id: 'dinheiro', label: 'Dinheiro', icon: <DollarSign size={14} /> },
                            { id: 'cartao', label: 'Cartão', icon: <CreditCard size={14} /> },
                            { id: 'boleto', label: 'Boleto', icon: <Barcode size={14} /> }
                        ].map(method => (
                            <button
                                key={method.id}
                                type="button"
                                onClick={() => setManualPaymentMethod(method.id)}
                                className={cn(
                                    "flex flex-col items-center justify-center py-3 px-1 rounded-2xl border-2 transition-all gap-1.5",
                                    manualPaymentMethod === method.id 
                                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-100" 
                                        : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                                )}
                            >
                                {method.icon}
                                <span className="text-[10px] font-black uppercase tracking-tighter">{method.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 px-2">
                        <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                            Data do Pagamento
                        </label>
                        <ExpressDatePicker
                            date={actionDate}
                            onChange={(date) => setActionDate(date || format(new Date(), 'yyyy-MM-dd'))}
                        />
                    </div>

                    <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                        <p className="text-[10px] text-slate-400 font-bold uppercase text-center leading-tight">
                            O status será alterado para <span className="text-emerald-600">PAGO</span> e sincronizado com o <b>Tiny ERP</b>.
                        </p>
                    </div>

                    <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
                        <AlertDialogCancel 
                            disabled={payInvoiceMutation.isPending}
                            className="flex-1 h-14 rounded-2xl border-gray-100 font-bold text-gray-400 hover:bg-gray-50 transition-all uppercase text-[10px]"
                        >
                            Voltar
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            disabled={payInvoiceMutation.isPending}
                            onClick={(e) => {
                                e.preventDefault();
                                if (invoiceToPay) {
                                    payInvoiceMutation.mutate(invoiceToPay, {
                                        onSuccess: () => {
                                            setIsPayModalOpen(false);
                                            setInvoiceToPay(null);
                                        }
                                    });
                                }
                            }}
                            className="flex-1 h-14 rounded-2xl bg-green-600 hover:bg-green-700 font-black text-white shadow-lg shadow-green-100 transition-all uppercase text-[10px]"
                        >
                            {payInvoiceMutation.isPending ? "Processando..." : "Sim, Confirmar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal de Confirmação de Exclusão Definitiva (Red Theme) */}
            <AlertDialog open={isDeleteAuthModalOpen} onOpenChange={setIsDeleteAuthModalOpen}>
                <AlertDialogContent className="rounded-[32px] border-none p-8 max-w-md shadow-2xl">
                    <AlertDialogHeader className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6 animate-bounce-subtle">
                            <AlertTriangle size={42} />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-gray-900 tracking-tight">
                            Exclusão Irreversível
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 font-medium px-4 mt-2 leading-relaxed">
                            Você está prestes a apagar esta autorização e <strong className="text-red-600 font-black tracking-tighter uppercase">Todas as Faturas</strong> vinculadas a ela. Esta ação não poderá ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
                        <AlertDialogCancel className="flex-1 h-14 rounded-2xl border-gray-100 font-bold text-gray-400 hover:bg-gray-50 transition-all uppercase text-[10px]">
                            Manter Registro
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                if (authIdToDelete) {
                                    deleteAuthMutation.mutate(authIdToDelete);
                                    setIsDeleteAuthModalOpen(false);
                                }
                            }}
                            className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-700 font-black text-white shadow-lg shadow-red-200 transition-all uppercase text-[10px]"
                        >
                            Sim, Excluir Tudo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <EditAutorizacaoModal
                isOpen={isEditAuthOpen}
                onClose={() => {
                    setIsEditAuthOpen(false);
                    setAuthToEdit(null);
                }}
                autorizacao={authToEdit}
                onSuccess={refetchAuths}
            />

            <TransferAutorizacaoModal
                isOpen={isTransferModalOpen}
                onClose={() => {
                    setIsTransferModalOpen(false);
                    setAuthToTransfer(null);
                }}
                onSuccess={() => {
                    refetchAuths();
                }}
                autorizacao={authToTransfer}
            />

            {/* Modal de Confirmação de Desfazer Pagamento */}
            <AlertDialog open={!!undoInvoiceId} onOpenChange={(open) => !open && setUndoInvoiceId(null)}>
                <AlertDialogContent className="rounded-2xl border-gray-100 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                <Undo2 size={20} />
                            </div>
                            Desfazer Pagamento
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 pt-2">
                            Você está prestes a <span className="font-bold text-orange-600 uppercase">DESFAZER</span> o pagamento desta fatura. 
                            Ela voltará para o status "Em Aberto". Deseja continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-4 gap-2">
                        <AlertDialogCancel className="rounded-xl border-gray-200 font-bold text-xs uppercase tracking-wider">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                handleUndoPayment();
                            }}
                            className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider px-6"
                        >
                            Sim, Desfazer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Data de Vencimento</label>
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
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Motivo da Alteração (Opcional)</label>
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
                            disabled={!editAmount || !editDueDate ||
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
                                    toast.success(res.data.message);
                                    if (res.data.tiny_errors?.length > 0) {
                                        setTinyErrorsList(res.data.tiny_errors);
                                        setTinyErrorsOpen(true);
                                    }
                                    refetchInvoices();
                                    queryClient.invalidateQueries({ queryKey: ["financial-invoices"] });
                                    queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
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
                                    toast.success(res.data.message);
                                    if (res.data.tiny_errors?.length > 0) {
                                        setTinyErrorsList(res.data.tiny_errors);
                                        setTinyErrorsOpen(true);
                                    }
                                    refetchInvoices();
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
                            O sistema local foi atualizado com sucesso, mas houve falhas ao sincronizar com o Tiny ERP.
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
            {/* Modal de Confirmação de Baixa em Lote */}
            <AlertDialog open={isBulkSettleModalOpen} onOpenChange={setIsBulkSettleModalOpen}>
                <AlertDialogContent className="rounded-2xl border-gray-100 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Landmark size={20} />
                            </div>
                            Confirmar Baixa em Lote
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 pt-2">
                            Você está prestes a marcar <span className="font-bold text-gray-900">{selectedInvoices.length} faturas</span> como <span className="font-bold text-emerald-600 uppercase">PAGAS</span>. 
                            Esta ação irá sincronizar a baixa com o Tiny ERP e não pode ser desfeita em massa.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-4 gap-2">
                        <AlertDialogCancel className="rounded-xl border-gray-200 font-bold text-xs uppercase tracking-wider">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                handleBulkMarkAsPaid();
                            }}
                            className="rounded-xl bg-[#B70F0A] hover:bg-[#8e0c08] text-white font-black text-xs uppercase tracking-wider px-6"
                        >
                            Confirmar Recebimento
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
