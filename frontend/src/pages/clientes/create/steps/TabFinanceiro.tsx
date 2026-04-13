import { useState } from "react";
import { useParams } from "react-router-dom";
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
    Smartphone
} from "lucide-react";
import { useFormikContext } from "formik";
import { cn } from "@/lib/utils";
import CreateAutorizacaoModal from "../../../financeiro/components/CreateAutorizacaoModal";
import PreviewAutorizacaoModal from "../../../financeiro/components/PreviewAutorizacaoModal";
import JustificarAssinaturaModal from "../../../financeiro/components/JustificarAssinaturaModal";
import { MoreHorizontal, Share2, Send, CheckCircle, DollarSign, ShieldCheck } from "lucide-react";
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
    const [isJustifyOpen, setIsJustifyOpen] = useState(false);
    const [selectedAuth, setSelectedAuth] = useState<{ id: number, numero: number } | null>(null);

    // Discount States
    const [showDiscount, setShowDiscount] = useState(false);
    const [discountValue, setDiscountValue] = useState(0);
    const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");

    // Permuta States
    const [isPermuta, setIsPermuta] = useState(false);
    const [permutaAmount, setPermutaAmount] = useState<number>(0);
    const [permutaDescription, setPermutaDescription] = useState("");

    const [isWarningOpen, setIsWarningOpen] = useState(false);

    // Fetch Invoices
    const { data: invoices, isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
        queryKey: ["client-invoices", id],
        queryFn: async () => {
            const resp = await axios.get(`/v1/clientes/${id}/invoices`);
            return resp.data;
        },
    });

    // Fetch Autorizações
    const { data: autorizacoes, isLoading: isLoadingAuths, refetch: refetchAuths } = useQuery<Autorizacao[]>({
        queryKey: ["client-autorizacoes", id],
        queryFn: async () => {
            const resp = await axios.get("/v1/autorizacoes", { params: { cliente_id: id } });
            return resp.data.data;
        },
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

    const getStatusBadge = (status: string) => {
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
                        <XCircle size={12} /> Cancelado
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

    const XCircle = ({ size }: { size: number }) => <AlertCircle size={size} />; // Fallback icon

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
                                autorizacoes?.map((auth) => (
                                    <tr key={auth.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-black text-gray-900">
                                            #{auth.numero.toString().padStart(5, '0')}
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

                                                    {auth.status === "rascunho" && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleSendLink(auth.id)}
                                                            className="rounded-lg font-bold text-xs gap-2 py-2 text-blue-600 bg-blue-50/50 hover:bg-blue-50 cursor-pointer"
                                                        >
                                                            <Share2 size={14} /> Enviar p/ Assinatura
                                                        </DropdownMenuItem>
                                                    )}

                                                    {auth.status === "aguardando_assinatura" && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => handleSendLink(auth.id)}
                                                                className="rounded-lg font-bold text-xs gap-2 py-2 text-yellow-600 bg-yellow-50 cursor-pointer mb-1"
                                                            >
                                                                <LinkIcon size={14} /> Copiar Link p/ Envio Manual
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedAuth({ id: auth.id, numero: auth.numero });
                                                                    setIsJustifyOpen(true);
                                                                }}
                                                                className="rounded-lg font-bold text-xs gap-2 py-2 text-emerald-600 bg-emerald-50 cursor-pointer"
                                                            >
                                                                <ShieldCheck size={14} /> Justificar Assinatura
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                    {auth.status === "assinado" && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleGenerateInvoicesManual(auth.id)}
                                                            className="rounded-lg font-bold text-xs gap-2 py-2 text-emerald-600 bg-emerald-50 cursor-pointer"
                                                        >
                                                            <DollarSign size={14} /> Gerar Faturas Tiny
                                                        </DropdownMenuItem>
                                                    )}
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
                <button
                    onClick={() => {
                        const hasPendingAuth = autorizacoes?.some(a => ['rascunho', 'aguardando_assinatura'].includes(a.status));
                        if (hasPendingAuth) {
                            setIsWarningOpen(true);
                        } else {
                            setIsModalOpen(true);
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors font-bold text-xs shadow-sm"
                >
                    <Plus size={18} />
                    Gerar Cobrança Avulsa
                </button>
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
                                <th className="px-6 py-4">Fatura</th>
                                <th className="px-6 py-4">Vencimento</th>
                                <th className="px-6 py-4">Valor</th>
                                <th className="px-6 py-4">Método</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoices && invoices.length > 0 ? (
                                invoices.map((invoice) => (
                                    <tr key={invoice.id} className="bg-white hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-gray-900">
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
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900">
                                                    R$ {Number(invoice.payable_amount ?? invoice.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                                {invoice.is_permuta && (
                                                    <span className="text-[9px] text-orange-600 font-bold uppercase tracking-tight bg-orange-50 px-1.5 py-0.5 rounded w-fit mt-1 border border-orange-100/50">
                                                        + Permuta R$ {Number(invoice.permuta_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">
                                                {invoice.payment_method || 'boleto'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-1.5">
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
                                                {invoice.group_id && invoice.total_parcels! > 1 && (
                                                    <button
                                                        onClick={() => handleDownloadCarnet(invoice.group_id!)}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                        title="Baixar Carnê Completo"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                )}
                                                {!invoice.payment_url && !invoice.group_id && (
                                                    <span className="text-[10px] text-gray-300 font-bold uppercase italic">Aguardando</span>
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

            <JustificarAssinaturaModal
                isOpen={isJustifyOpen}
                onClose={() => setIsJustifyOpen(false)}
                onSuccess={() => {
                    refetchAuths();
                    setIsJustifyOpen(false);
                }}
                autorizacaoId={selectedAuth?.id || null}
                numero={selectedAuth?.numero || null}
            />

            {/* Aviso de Duplicidade Elegante */}
            <AlertDialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
                <AlertDialogContent className="rounded-[32px] border-none p-8 max-w-md">
                    <AlertDialogHeader>
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                            <AlertCircle size={32} />
                        </div>
                        <AlertDialogTitle className="text-2xl font-bold text-gray-900 text-center">
                            Atenção: Autorizações Pendentes
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 text-center text-sm mt-2 font-medium">
                            Este cliente já possui autorizações aguardando assinatura. <br/>
                            Gerar uma cobrança manual agora pode resultar em <b>faturas duplicadas</b>. <br/><br/>
                            Deseja prosseguir mesmo assim?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 flex gap-3 sm:justify-start">
                        <AlertDialogCancel className="flex-1 h-12 rounded-2xl border-gray-100 font-bold text-xs uppercase text-gray-400 hover:bg-gray-50 transition-all">
                            Cancelar e Voltar
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => {
                                setIsWarningOpen(false);
                                setIsModalOpen(true);
                            }}
                            className="flex-1 h-12 rounded-2xl bg-[#B70F0A] hover:bg-[#8e0c08] font-bold text-xs uppercase text-white shadow-lg shadow-red-200 transition-all"
                        >
                            Prosseguir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
