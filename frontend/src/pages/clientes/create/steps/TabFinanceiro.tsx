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
}

export default function TabFinanceiro() {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("boleto");
    const [installments, setInstallments] = useState(1);
    const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));

    // Discount States
    const [showDiscount, setShowDiscount] = useState(false);
    const [discountValue, setDiscountValue] = useState(0);
    const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");

    // Fetch Invoices
    const { data: invoices, isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
        queryKey: ["client-invoices", id],
        queryFn: async () => {
            const resp = await axios.get(`/v1/clientes/${id}/invoices`);
            return resp.data;
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
        }) => {
            const resp = await axios.post(`/v1/clientes/${id}/invoices`, payload);
            return resp.data;
        },
        onSuccess: () => {
            toast.success("Cobrança(s) gerada(s) com sucesso!");
            queryClient.invalidateQueries({ queryKey: ["client-invoices", id] });
            setIsModalOpen(false);
            setInstallments(1);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Erro ao gerar cobrança.");
        },
    });

    const handleGenerateInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlan) {
            toast.error("Selecione um plano.");
            return;
        }
        createInvoiceMutation.mutate({
            plan_id: selectedPlan,
            due_date: dueDate,
            installments: installments,
            payment_method: paymentMethod,
            discount_value: discountValue,
            discount_type: discountType
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
            default:
                return status;
        }
    };

    const selectedPlanData = plans?.find(p => String(p.id) === selectedPlan);

    const calculateTotals = () => {
        if (!selectedPlanData) return { total: 0, discount: 0, final: 0, parcel: 0 };

        const basePrice = Number(selectedPlanData.price);
        const discount = discountType === "fixed"
            ? discountValue
            : (basePrice * discountValue) / 100;

        const final = Math.max(0, basePrice - discount);
        const parcel = final / installments;

        return {
            total: basePrice,
            discount,
            final,
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

            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <CreditCard className="text-[#B70F0A]" size={20} />
                        Gestão Financeira
                    </h3>
                    <p className="text-sm text-gray-500">Histórico de faturas e cobranças do cliente.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#B70F0A] text-white rounded-lg hover:bg-[#8e0c08] transition-colors font-medium shadow-sm"
                >
                    <Plus size={18} />
                    Gerar Cobrança
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
                                                    <span className="text-xs font-bold">#{invoice.id}</span>
                                                    {invoice.total_parcels && invoice.total_parcels > 1 && (
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
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            R$ {Number(invoice.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

                            {selectedPlanData && (
                                <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 mt-2">
                                    <div className="flex justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-tighter mb-2">
                                        <span>Resumo da Cobrança</span>
                                        <span className="text-[#B70F0A]">Valor Individual</span>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-baseline">
                                            <div>
                                                <p className="text-2xl font-black text-slate-800">
                                                    {installments}x R$ {totals.parcel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">
                                                    {paymentMethod === 'cartao' ? 'Cartão' : paymentMethod} • 1º Venc. {format(new Date(dueDate), "dd/MM")}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-slate-200/50 space-y-1">
                                            <div className="flex justify-between text-[11px] font-bold text-slate-400">
                                                <span>Subtotal</span>
                                                <span>R$ {totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            {totals.discount > 0 && (
                                                <div className="flex justify-between text-[11px] font-bold text-green-500">
                                                    <span>Desconto</span>
                                                    <span>- R$ {totals.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm font-black text-slate-700">
                                                <span>Total Final</span>
                                                <span>R$ {totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
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
                                    disabled={createInvoiceMutation.isPending || !selectedPlan}
                                    className="flex-[2] h-14 bg-[#B70F0A] text-white rounded-2xl hover:bg-[#8e0c08] font-black uppercase text-xs transition-all disabled:opacity-50 shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                                >
                                    {createInvoiceMutation.isPending ? "Processando..." : "Gerar Cobrança"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
