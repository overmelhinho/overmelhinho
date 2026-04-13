import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Textarea from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Calculator, Calendar, FileText, Check, User, Tag, Plus, DollarSign, ChevronUp, ChevronDown, Package } from "lucide-react";
import axios from "@/services/api";
import toast from "react-hot-toast";
import { format, addMonths } from "date-fns";
import { cn } from "@/lib/utils";

interface Cliente {
    id: number;
    nome_fantasia: string;
    razao_social: string;
    cpf_cnpj: string;
}

interface Plan {
    id: number;
    name: string;
    price: string;
    billing_cycle: string;
}

interface CreateAutorizacaoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialClientId?: number;
}

export default function CreateAutorizacaoModal({ isOpen, onClose, onSuccess, initialClientId }: CreateAutorizacaoModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [clienteId, setClienteId] = useState<number | null>(null);
    const [clientSearch, setClientSearch] = useState("");
    const [clients, setClients] = useState<Cliente[]>([]);
    const [isClientLoading, setIsClientLoading] = useState(false);

    const [form, setForm] = useState({
        tipo_publicidade: "WEB",
        titulo_anuncio: "",
        descricao_anuncio: "",
        valor_total: "",
        taxa_cadastro: "0",
        data_inicio: format(new Date(), "yyyy-MM-dd"),
        data_fim: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), "yyyy-MM-dd"),
        modo_pagamento: "parcelado",
        num_parcelas: "12",
        data_primeira_parcela: format(new Date(), "yyyy-MM-dd"),
        payment_method: "pix",
        observacoes_anuncio: "",
        observacoes_financeiro: "",
        // Novos campos
        plan_id: "",
        desconto_tipo: "fixed",
        desconto_valor: "0",
        is_permuta: false,
        permuta_amount: "0",
        permuta_description: ""
    });

    const [plans, setPlans] = useState<Plan[]>([]);
    const [showDiscount, setShowDiscount] = useState(false);

    const [parcelasPreview, setParcelasPreview] = useState<any[]>([]);

    // Client Search Logic
    useEffect(() => {
        if (initialClientId) {
            setClienteId(initialClientId);
            // Opcionalmente busca detalhes do cliente para exibir o nome
            const fetchInitialClient = async () => {
                try {
                    const response = await axios.get(`/v1/clientes/${initialClientId}`);
                    const c = response.data.data || response.data;
                    setClients([c]);
                    setClientSearch(c.nome_fantasia || c.razao_social);
                } catch (e) {
                    console.error("Erro ao buscar cliente inicial", e);
                }
            };
            fetchInitialClient();
            return;
        }

        const fetchClients = async () => {
            if (clientSearch.length < 3) return;
            setIsClientLoading(true);
            try {
                const response = await axios.get(`/v1/clientes?q=${clientSearch}`);
                setClients(response.data.data || []);
            } catch (error) {
                console.error("Erro ao buscar clientes", error);
            } finally {
                setIsClientLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchClients, 500);
        return () => clearTimeout(timeoutId);
    }, [clientSearch]);

    // Fetch Plans
    useEffect(() => {
        if (!isOpen) return;

        const fetchPlans = async () => {
            try {
                console.log("[CreateAutorizacaoModal] Buscando planos...");
                const response = await axios.get("/v1/plans");
                // Algumas APIs retornam { data: [...] }, outras retornam [...] direto
                const plansData = response.data?.data || response.data || [];
                console.log("[CreateAutorizacaoModal] Planos carregados:", plansData);
                setPlans(plansData);
            } catch (error) {
                console.error("[CreateAutorizacaoModal] Erro ao buscar planos:", error);
                toast.error("Erro ao carregar planos de serviço.");
            }
        };
        fetchPlans();
    }, [isOpen]);

    const formatCurrency = (value: string) => {
        const digits = value.replace(/\D/g, "");
        const amount = parseFloat(digits) / 100;
        if (isNaN(amount)) return "";
        return amount.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const parseCurrency = (value: string) => {
        if (!value) return "0";
        return value.replace(/\./g, "").replace(",", ".");
    };

    // Calculate Totals Logic
    const calculateTotals = () => {
        const basePrice = parseFloat(parseCurrency(form.valor_total)) || 0;
        const discountValue = parseFloat(form.desconto_valor) || 0;

        const discountAmount = form.desconto_tipo === "fixed"
            ? discountValue
            : (basePrice * discountValue) / 100;

        const priceAfterDiscount = Math.max(0, basePrice - discountAmount);
        const taxa = parseFloat(form.taxa_cadastro) || 0;
        const totalComTaxa = priceAfterDiscount + taxa;

        const permuta = form.is_permuta ? parseFloat(parseCurrency(form.permuta_amount || "0")) : 0;
        const finalPayable = Math.max(0, totalComTaxa - permuta);

        const numParcelas = parseInt(form.num_parcelas) || 1;
        const valParcela = finalPayable / numParcelas;

        return {
            subtotal: basePrice,
            discount: discountAmount,
            taxa,
            permuta,
            finalPayable,
            valParcela
        };
    };

    const totals = calculateTotals();

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const formatted = formatCurrency(value);
        setForm(prev => ({ ...prev, [name]: formatted }));
    };

    // Calculate Installments Preview and Sync with State
    useEffect(() => {
        const basePrice = parseFloat(parseCurrency(form.valor_total)) || 0;
        const discountValue = parseFloat(form.desconto_valor) || 0;
        const discountAmount = form.desconto_tipo === "fixed" ? discountValue : (basePrice * discountValue) / 100;
        const priceAfterDiscount = Math.max(0, basePrice - discountAmount);
        const taxa = parseFloat(form.taxa_cadastro) || 0;
        const totalComTaxa = priceAfterDiscount + taxa;
        const permuta = form.is_permuta ? parseFloat(parseCurrency(form.permuta_amount || "0")) : 0;
        const finalPayable = Math.max(0, totalComTaxa - permuta);

        const num = parseInt(form.num_parcelas) || 1;
        // Fix: Parse YYYY-MM-DD manually to avoid UTC shift
        const [y, m, d] = form.data_primeira_parcela.split("-").map(Number);
        const start = new Date(y, m - 1, d);

        if (finalPayable <= 0) {
            setParcelasPreview([{ numero: 1, vencimento: format(start, "yyyy-MM-dd"), label: format(start, "dd/MM/yyyy"), valor: "0.00" }]);
            return;
        }

        const baseVal = Math.floor((finalPayable / num) * 100) / 100;
        const diff = finalPayable - (baseVal * num);

        const newParcelas = Array.from({ length: num }).map((_, i) => {
            const date = addMonths(start, i);
            return {
                numero: i + 1,
                vencimento: format(date, "yyyy-MM-dd"), // internal state for input
                label: format(date, "dd/MM/yyyy"), // display
                valor: (i === num - 1 ? (baseVal + diff) : baseVal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
            };
        });

        setParcelasPreview(newParcelas);
    }, [form.valor_total, form.taxa_cadastro, form.num_parcelas, form.data_primeira_parcela, form.desconto_valor, form.desconto_tipo, form.is_permuta, form.permuta_amount]);

    const handleParcelaDateChange = (index: number, newDate: string) => {
        const updated = [...parcelasPreview];
        const [y, m, d] = newDate.split("-").map(Number);
        const date = new Date(y, m - 1, d);
        updated[index].vencimento = newDate;
        updated[index].label = format(date, "dd/MM/yyyy");
        setParcelasPreview(updated);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        console.log("[CreateAutorizacaoModal] Iniciando submissão...", { clienteId, form });

        if (!clienteId) {
            toast.error("Por favor, selecione um cliente.");
            return;
        }

        if (!form.titulo_anuncio) {
            toast.error("Por favor, informe o título do anúncio.");
            return;
        }

        const valor = parseFloat(parseCurrency(form.valor_total));
        if (isNaN(valor) || valor <= 0) {
            toast.error("Por favor, informe um valor total válido.");
            return;
        }

        // Validação de datas
        if (new Date(form.data_fim) <= new Date(form.data_inicio)) {
            toast.error("A data de término deve ser posterior à data de início.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...form,
                cliente_id: clienteId,
                num_parcelas: parseInt(form.num_parcelas) || 1,
                valor_total: valor,
                taxa_cadastro: parseFloat(form.taxa_cadastro) || 0,
                desconto_valor: parseFloat(form.desconto_valor || "0") || 0,
                permuta_amount: parseFloat(parseCurrency(form.permuta_amount || "0")) || 0,
                is_permuta: !!form.is_permuta,
                parcelas: parcelasPreview.map(p => ({ vencimento: p.vencimento }))
            };

            console.log("[CreateAutorizacaoModal] Enviando payload:", payload);
            const response = await axios.post("/v1/autorizacoes", payload);
            console.log("[CreateAutorizacaoModal] Sucesso:", response.data);

            toast.success("Autorização criada com sucesso!");
            onSuccess();
        } catch (error: any) {
            console.error("[CreateAutorizacaoModal] Erro ao salvar:", error);
            const message = error.response?.data?.message || "Erro ao criar autorização.";
            toast.error(message);

            // Se houver erros de validação específicos do Laravel
            if (error.response?.data?.errors) {
                const firstError = Object.values(error.response.data.errors)[0] as string[];
                if (firstError) toast.error(firstError[0]);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePlanSelect = (planId: string) => {
        const plan = plans.find(p => String(p.id) === planId);
        if (plan) {
            setForm(prev => ({
                ...prev,
                plan_id: planId,
                titulo_anuncio: plan.name
            }));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <div className="bg-gray-900 p-8 text-white sticky top-0 z-10">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-red-600 rounded-xl shadow-lg shadow-red-600/30">
                                    <FileText className="text-white" size={24} />
                                </div>
                                <DialogTitle className="text-3xl font-black tracking-tight">Novo Contrato de Publicidade</DialogTitle>
                            </div>
                            <DialogDescription className="text-gray-400 font-medium">
                                Preencha os dados abaixo para gerar a autorização de faturamento e o PDF assinado pelo cliente.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* 1. SELEÇÃO DE CLIENTE */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-[10px] font-black">1</span>
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Identificação do Cliente</h3>
                            </div>

                            {!clienteId ? (
                                <div className="space-y-3">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Digite o nome fantasia ou CNPJ para buscar o cliente..."
                                            className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/50 py-4 pl-12 pr-4 text-base focus:border-red-600 focus:bg-white focus:outline-none transition-all font-bold placeholder:text-gray-400"
                                            value={clientSearch}
                                            onChange={(e) => setClientSearch(e.target.value)}
                                        />
                                        {isClientLoading && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                                            </div>
                                        )}
                                    </div>

                                    {clients.length > 0 && (
                                        <div className="rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="max-h-60 overflow-y-auto">
                                                {clients.map(c => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setClienteId(c.id);
                                                            setClientSearch(c.nome_fantasia);
                                                            setClients([]);
                                                        }}
                                                        className="w-full flex items-center justify-between p-4 hover:bg-red-50 text-left transition-colors border-b border-gray-50 last:border-0"
                                                    >
                                                        <div>
                                                            <p className="font-bold text-gray-900">{c.nome_fantasia}</p>
                                                            <p className="text-xs text-gray-500 font-medium">{c.razao_social} · {c.cpf_cnpj}</p>
                                                        </div>
                                                        <Check size={18} className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-2xl animate-in zoom-in-95 duration-200">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-green-200 rounded-xl text-green-700">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-green-800 uppercase tracking-widest">Cliente Selecionado</p>
                                            <p className="text-lg font-black text-gray-900">{clientSearch}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setClienteId(null);
                                            setClientSearch("");
                                        }}
                                        className="text-red-600 hover:bg-red-50 rounded-xl font-bold"
                                    >
                                        Alterar Cliente
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* 2. DADOS DA PUBLICIDADE */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                            <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-[10px] font-black">2</span>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Publicidade</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Plano / Serviço</Label>
                                            <Select value={form.plan_id} onValueChange={handlePlanSelect}>
                                                <SelectTrigger className="rounded-xl h-11 border-gray-200 font-bold focus:ring-red-500">
                                                    <SelectValue placeholder="Selecione um plano (opcional)" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-gray-100 shadow-xl font-bold">
                                                    {plans.map(plan => (
                                                        <SelectItem key={plan.id} value={String(plan.id)}>
                                                            {plan.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Produto / Meio</Label>
                                            <Select value={form.tipo_publicidade} onValueChange={(v) => handleSelectChange('tipo_publicidade', v)}>
                                                <SelectTrigger className="rounded-xl h-11 border-gray-200 font-bold focus:ring-red-500">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-gray-100 shadow-xl font-bold">
                                                    <SelectItem value="WEB">Portal O Vermelhinho (WEB)</SelectItem>
                                                    <SelectItem value="APP">Aplicativo (Mobile)</SelectItem>
                                                    <SelectItem value="FISICO">Mídia Física (Outdoor/Totem)</SelectItem>
                                                    <SelectItem value="REDES">Redes Sociais (Instagram/FB)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Título do Anúncio (Curto)</Label>
                                        <Input
                                            name="titulo_anuncio"
                                            value={form.titulo_anuncio}
                                            onChange={handleChange}
                                            placeholder="Ex: Super Banner Home"
                                            className="rounded-xl h-11 border-gray-200 font-bold focus:ring-red-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Descrição / Especificações</Label>
                                        <Textarea
                                            name="descricao_anuncio"
                                            value={form.descricao_anuncio}
                                            onChange={handleChange}
                                            placeholder="Descreva o formato, posição ou detalhes técnicos..."
                                            className="rounded-xl min-h-[100px] border-gray-200 font-bold focus:ring-red-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Início Contrato</Label>
                                            <Input
                                                type="date"
                                                name="data_inicio"
                                                value={form.data_inicio}
                                                onChange={handleChange}
                                                className="rounded-xl h-11 border-gray-200 font-bold focus:ring-red-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Vencimento Contrato</Label>
                                            <Input
                                                type="date"
                                                name="data_fim"
                                                value={form.data_fim}
                                                onChange={handleChange}
                                                className="rounded-xl h-11 border-gray-200 font-bold focus:ring-red-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. PAGAMENTO E PARCELAMENTO */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-[10px] font-black">3</span>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Investimento e Pagamento</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Valor Total (Bruto)</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                                <Input
                                                    type="text"
                                                    name="valor_total"
                                                    value={form.valor_total}
                                                    onChange={handleCurrencyChange}
                                                    placeholder="0,00"
                                                    className="rounded-xl h-11 border-gray-200 pl-10 font-black text-gray-900 focus:ring-red-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Taxa Cadastro</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">R$</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    name="taxa_cadastro"
                                                    value={form.taxa_cadastro}
                                                    onChange={handleChange}
                                                    className="rounded-xl h-11 border-gray-200 pl-9 font-bold text-gray-600 focus:ring-red-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Seção de Desconto */}
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowDiscount(!showDiscount)}
                                            className="flex items-center gap-2 text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 hover:opacity-80 transition-all"
                                        >
                                            <Tag size={12} />
                                            {showDiscount ? "Remover Desconto" : "Aplicar Desconto?"}
                                            {showDiscount ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </button>

                                        {showDiscount && (
                                            <div className="flex gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-top-2 duration-200">
                                                <div className="flex-1">
                                                    <Input
                                                        type="number"
                                                        name="desconto_valor"
                                                        value={form.desconto_valor}
                                                        onChange={handleChange}
                                                        placeholder="Valor"
                                                        className="h-10 border-gray-100 rounded-xl font-bold"
                                                    />
                                                </div>
                                                <div className="flex bg-white rounded-xl border border-gray-100 p-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectChange('desconto_tipo', 'fixed')}
                                                        className={cn(
                                                            "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                                                            form.desconto_tipo === "fixed" ? "bg-red-600 text-white" : "text-gray-400"
                                                        )}
                                                    >
                                                        R$
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectChange('desconto_tipo', 'percent')}
                                                        className={cn(
                                                            "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                                                            form.desconto_tipo === "percent" ? "bg-red-600 text-white" : "text-gray-400"
                                                        )}
                                                    >
                                                        %
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Seção de Permuta */}
                                    <div className="pt-2 border-t border-gray-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Possui Permuta?</label>
                                            <button
                                                type="button"
                                                onClick={() => handleSelectChange('is_permuta', (!form.is_permuta) as any)}
                                                className={cn(
                                                    "w-11 h-6 rounded-full transition-colors relative",
                                                    form.is_permuta ? "bg-red-600" : "bg-gray-200"
                                                )}
                                            >
                                                <span className={cn(
                                                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                                                    form.is_permuta ? "translate-x-5" : "translate-x-0"
                                                )} />
                                            </button>
                                        </div>

                                        {form.is_permuta && (
                                            <div className="space-y-3 animate-in fade-in duration-300">
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">R$</span>
                                                    <Input
                                                        type="text"
                                                        name="permuta_amount"
                                                        value={form.permuta_amount}
                                                        onChange={handleCurrencyChange}
                                                        placeholder="Valor abatido por permuta"
                                                        className="pl-9 rounded-xl h-11 border-gray-200 font-bold"
                                                    />
                                                </div>
                                                <Textarea
                                                    name="permuta_description"
                                                    value={form.permuta_description}
                                                    onChange={handleChange}
                                                    placeholder="Descreva a permuta (ex: 2 vouchers, troca de serviços...)"
                                                    className="rounded-xl min-h-[60px] border-gray-200 font-medium text-xs"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nº Parcelas</Label>
                                            <Select value={form.num_parcelas} onValueChange={(v) => handleSelectChange('num_parcelas', v)}>
                                                <SelectTrigger className="rounded-xl h-11 border-gray-200 font-bold focus:ring-red-500">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-gray-100 shadow-xl font-bold">
                                                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24, 36].map(n => (
                                                        <SelectItem key={n} value={String(n)}>{n}x Parcelas</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Data 1ª Parcela</Label>
                                            <Input
                                                type="date"
                                                name="data_primeira_parcela"
                                                value={form.data_primeira_parcela}
                                                onChange={handleChange}
                                                className="rounded-xl h-11 border-gray-200 font-bold focus:ring-red-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Meio de Cobrança</Label>
                                        <Select value={form.payment_method} onValueChange={(v) => handleSelectChange('payment_method', v)}>
                                            <SelectTrigger className="rounded-xl h-11 border-gray-200 font-bold focus:ring-red-500">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 shadow-xl font-bold">
                                                <SelectItem value="pix">PIX (Recomendado)</SelectItem>
                                                <SelectItem value="boleto">Boleto Bancário</SelectItem>
                                                <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                                                <SelectItem value="dinheiro">Dinheiro / Outro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Listagem Editável de Parcelas (apenas a partir da 2ª) */}
                                    {parseInt(form.num_parcelas) > 1 && parcelasPreview.length > 1 && (
                                        <div className="pt-4 border-t border-gray-50">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 block">Próximos Vencimentos</Label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {parcelasPreview.slice(1).map((p, idx) => (
                                                    <div key={idx} className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[9px] font-black text-gray-400 uppercase">{p.numero}ª Parcela</span>
                                                            <span className="text-[9px] font-black text-red-600">R$ {p.valor}</span>
                                                        </div>
                                                        <Input
                                                            type="date"
                                                            value={p.vencimento}
                                                            onChange={(e) => handleParcelaDateChange(idx + 1, e.target.value)}
                                                            className="h-8 text-xs font-bold border-gray-200 rounded-lg px-2"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Novo Resumo Financeiro */}
                                    <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl animate-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                                            <div className="flex items-center gap-2">
                                                <Calculator size={16} className="text-red-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Resumo do Contrato</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2.5">
                                            <div className="flex justify-between text-[11px] font-bold text-gray-400">
                                                <span>Valor Bruto</span>
                                                <span>R$ {totals.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>

                                            {totals.discount > 0 && (
                                                <div className="flex justify-between text-[11px] font-bold text-green-400">
                                                    <span>(-) Desconto</span>
                                                    <span>R$ {totals.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            )}

                                            {totals.taxa > 0 && (
                                                <div className="flex justify-between text-[11px] font-bold text-blue-400">
                                                    <span>(+) Taxa de Cadastro</span>
                                                    <span>R$ {totals.taxa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            )}

                                            {totals.permuta > 0 && (
                                                <div className="flex justify-between text-[11px] font-bold text-orange-400">
                                                    <span>(-) Permuta</span>
                                                    <span>R$ {totals.permuta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            )}

                                            <div className="pt-2 mt-2 border-t border-white/5 flex justify-between items-center">
                                                <span className="text-[11px] font-black uppercase text-red-500">Total a Receber</span>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-white leading-none">R$ {totals.finalPayable.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                    {totals.finalPayable > 0 && parseInt(form.num_parcelas) > 1 && (
                                                        <p className="text-[9px] text-gray-400 font-bold pt-1">{form.num_parcelas}x de R$ {totals.valParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. OBSERVAÇÕES */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Observações p/ o Anúncio</Label>
                                <Textarea
                                    name="observacoes_anuncio"
                                    value={form.observacoes_anuncio}
                                    onChange={handleChange}
                                    placeholder="Instruções para a equipe de criação..."
                                    className="rounded-xl min-h-[80px] border-gray-200 font-medium text-sm focus:ring-red-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Observações p/ o Financeiro</Label>
                                <Textarea
                                    name="observacoes_financeiro"
                                    value={form.observacoes_financeiro}
                                    onChange={handleChange}
                                    placeholder="Instruções de cobrança, faturamento..."
                                    className="rounded-xl min-h-[80px] border-gray-200 font-medium text-sm focus:ring-red-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-8 border-t border-gray-100 sticky bottom-0 z-10 flex flex-col sm:flex-row gap-4 sm:justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="rounded-xl font-bold h-11"
                        >
                            Cancelar e Sair
                        </Button>
                        <Button
                            type="button"
                            disabled={isSubmitting || !clienteId}
                            onClick={() => handleSubmit()}
                            className="bg-gray-900 hover:bg-black text-white font-black rounded-xl px-10 h-11 shadow-xl shadow-gray-200 transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div> Salvando...</>
                            ) : (
                                <><Check size={18} /> Gerar Contrato (Rascunho)</>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
