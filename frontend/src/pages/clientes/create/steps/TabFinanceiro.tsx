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
    FileText
} from "lucide-react";

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
    plan?: Plan;
}

export default function TabFinanceiro() {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState("");
    const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));

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
        mutationFn: async (payload: { plan_id: string; due_date: string }) => {
            const resp = await axios.post(`/v1/clientes/${id}/invoices`, payload);
            return resp.data;
        },
        onSuccess: () => {
            toast.success("Cobrança gerada com sucesso!");
            queryClient.invalidateQueries({ queryKey: ["client-invoices", id] });
            setIsModalOpen(false);
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
        createInvoiceMutation.mutate({ plan_id: selectedPlan, due_date: dueDate });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Link copiado!");
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "paid":
                return (
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle2 size={14} /> Pago
                    </span>
                );
            case "pending":
                return (
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        <Clock size={14} /> Pendente
                    </span>
                );
            case "canceled":
                return (
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <AlertCircle size={14} /> Cancelado
                    </span>
                );
            default:
                return status;
        }
    };

    return (
        <div className="space-y-6">
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
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4">Fatura</th>
                                <th className="px-6 py-4">Vencimento</th>
                                <th className="px-6 py-4">Valor</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 truncate">
                            {invoices && invoices.length > 0 ? (
                                invoices.map((invoice) => (
                                    <tr key={invoice.id} className="bg-white hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <div className="flex flex-col">
                                                <span>#{invoice.id}</span>
                                                <span className="text-xs text-gray-400 font-normal">
                                                    {invoice.plan?.name || "Avulso"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">
                                            R$ {Number(invoice.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                {invoice.payment_url && (
                                                    <>
                                                        <button
                                                            onClick={() => copyToClipboard(invoice.payment_url!)}
                                                            title="Copiar link"
                                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                                        >
                                                            <Copy size={16} />
                                                        </button>
                                                        <a
                                                            href={invoice.payment_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="Abrir link"
                                                            className="p-2 text-[#B70F0A] hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </a>
                                                    </>
                                                )}
                                                {!invoice.payment_url && (
                                                    <span className="text-xs text-gray-400 italic">Link não gerado</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText size={42} strokeWidth={1} />
                                            <p>Nenhuma fatura encontrada para este cliente.</p>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-[#B70F0A] p-6 text-white">
                            <h3 className="text-xl font-bold">Nova Cobrança</h3>
                            <p className="text-red-100 text-sm opacity-90">O link será gerado automaticamente via Tiny ERP.</p>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Plano / Serviço
                                </label>
                                <select
                                    value={selectedPlan}
                                    onChange={(e) => setSelectedPlan(e.target.value)}
                                    className="w-full rounded-xl border-gray-300 focus:ring-[#B70F0A] focus:border-[#B70F0A] shadow-sm"
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Vencimento
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full rounded-xl border-gray-300 focus:ring-[#B70F0A] focus:border-[#B70F0A] shadow-sm"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGenerateInvoice}
                                    disabled={createInvoiceMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-[#B70F0A] text-white rounded-xl hover:bg-[#8e0c08] font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {createInvoiceMutation.isPending ? "Gerando..." : "Confirmar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
