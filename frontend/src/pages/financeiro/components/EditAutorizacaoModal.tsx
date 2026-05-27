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
import { Calculator, Calendar, FileText, Check, User, Tag, ChevronUp, ChevronDown, Landmark, ShieldCheck, Info, RefreshCw } from "lucide-react";
import axios from "@/services/api";
import toast from "react-hot-toast";
import { format, addMonths } from "date-fns";
import { cn } from "@/lib/utils";

interface Plan {
    id: number;
    name: string;
    price: string;
    billing_cycle: string;
}

interface EditAutorizacaoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    autorizacao: any | null;
}

export default function EditAutorizacaoModal({ isOpen, onClose, onSuccess, autorizacao }: EditAutorizacaoModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [showDiscount, setShowDiscount] = useState(false);
    const [parcelasPreview, setParcelasPreview] = useState<any[]>([]);

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
        plan_id: "",
        desconto_tipo: "fixed",
        desconto_valor: "0",
        is_permuta: false,
        permuta_amount: "0",
        permuta_description: "",
        responsavel_nome: "",
        responsavel_preferencia: "whatsapp",
    });

    // Populate form with existing data
    useEffect(() => {
        if (autorizacao && isOpen) {
            console.log("EditAutorizacaoModal: autorizacao data", autorizacao);
            const ensureIsoDate = (dateStr: string | null | undefined) => {
                if (!dateStr) return "";
                if (typeof dateStr !== 'string') return "";
                const cleanDate = dateStr.split(' ')[0].split('T')[0];
                if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) return cleanDate;
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDate)) {
                    const [d, m, y] = cleanDate.split("/");
                    return `${y}-${m}-${d}`;
                }
                return cleanDate;
            };

            setForm({
                tipo_publicidade: autorizacao.tipo_publicidade || "WEB",
                titulo_anuncio: autorizacao.titulo_anuncio || "",
                descricao_anuncio: autorizacao.descricao_anuncio || "",
                valor_total: Number(autorizacao.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                taxa_cadastro: String(autorizacao.taxa_cadastro || "0"),
                data_inicio: ensureIsoDate(autorizacao.data_inicio) || format(new Date(), "yyyy-MM-dd"),
                data_fim: ensureIsoDate(autorizacao.data_fim) || format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), "yyyy-MM-dd"),
                modo_pagamento: autorizacao.modo_pagamento || "parcelado",
                num_parcelas: String(autorizacao.num_parcelas || "1"),
                data_primeira_parcela: ensureIsoDate(autorizacao.data_primeira_parcela) || format(new Date(), "yyyy-MM-dd"),
                payment_method: autorizacao.payment_method || "pix",
                observacoes_anuncio: autorizacao.observacoes_anuncio || "",
                observacoes_financeiro: autorizacao.observacoes_financeiro || "",
                plan_id: String(autorizacao.plan_id || ""),
                desconto_tipo: autorizacao.desconto_tipo || "fixed",
                desconto_valor: String(autorizacao.desconto_valor || "0"),
                is_permuta: !!autorizacao.is_permuta,
                permuta_amount: Number(autorizacao.permuta_amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                permuta_description: autorizacao.permuta_description || "",
                responsavel_nome: autorizacao.responsavel_nome || "",
                responsavel_preferencia: autorizacao.responsavel_preferencia || "whatsapp",
            });

            if (Number(autorizacao.desconto_valor) > 0) setShowDiscount(true);
            
            // Preview parcelas existing
            if (autorizacao.parcelas && autorizacao.parcelas.length > 0) {
                setParcelasPreview(autorizacao.parcelas.map((p: any) => {
                    let label = "Data Inválida";
                    try {
                        const dateStr = ensureIsoDate(p.vencimento);
                        const date = new Date(dateStr + 'T12:00:00');
                        if (!isNaN(date.getTime())) {
                            label = format(date, "dd/MM/yyyy");
                        }
                    } catch (e) {}
                    
                    return {
                        numero: p.numero,
                        vencimento: ensureIsoDate(p.vencimento),
                        label: label,
                        valor: Number(p.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    };
                }));
            }
        }
    }, [autorizacao, isOpen]);

    // Fetch Plans
    useEffect(() => {
        if (!isOpen) return;
        const fetchPlans = async () => {
            try {
                const response = await axios.get("/v1/plans");
                setPlans(response.data?.data || response.data || []);
            } catch (error) {
                toast.error("Erro ao carregar planos.");
            }
        };
        fetchPlans();
    }, [isOpen]);

    const formatCurrency = (value: string) => {
        const digits = value.replace(/\D/g, "");
        const amount = parseFloat(digits) / 100;
        if (isNaN(amount)) return "";
        return amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const parseCurrency = (value: string) => {
        if (!value) return "0";
        return value.replace(/\./g, "").replace(",", ".");
    };

    const calculateTotals = () => {
        const basePrice = parseFloat(parseCurrency(form.valor_total)) || 0;
        const discountValue = parseFloat(form.desconto_valor) || 0;
        const discountAmount = form.desconto_tipo === "fixed" ? discountValue : (basePrice * discountValue) / 100;
        const priceAfterDiscount = Math.max(0, basePrice - discountAmount);
        const taxa = parseFloat(form.taxa_cadastro) || 0;
        const totalComTaxa = priceAfterDiscount + taxa;
        const permuta = form.is_permuta ? parseFloat(parseCurrency(form.permuta_amount || "0")) : 0;
        const finalPayable = Math.max(0, totalComTaxa - permuta);
        const numParcelas = parseInt(form.num_parcelas) || 1;
        const valParcela = finalPayable / numParcelas;

        return { subtotal: basePrice, discount: discountAmount, taxa, permuta, finalPayable, valParcela };
    };

    const totals = calculateTotals();

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: formatCurrency(value) }));
    };

    // Auto-update parcelas preview when financial values change
    useEffect(() => {
        try {
            if (!form.data_primeira_parcela) return;

            const num = parseInt(form.num_parcelas) || 1;
            const parts = form.data_primeira_parcela.split("-");
            if (parts.length !== 3) return;

            const [y, m, d] = parts.map(Number);
            const start = new Date(y, m - 1, d);
            
            if (isNaN(start.getTime())) return;

            const finalPayable = totals.finalPayable;

            if (finalPayable <= 0) {
                setParcelasPreview([{ numero: 1, vencimento: form.data_primeira_parcela, label: format(start, "dd/MM/yyyy"), valor: "0.00" }]);
                return;
            }

            const baseVal = Math.floor((finalPayable / num) * 100) / 100;
            const diff = finalPayable - (baseVal * num);

            const newParcelas = Array.from({ length: num }).map((_, i) => {
                const date = addMonths(start, i);
                return {
                    numero: i + 1,
                    vencimento: format(date, "yyyy-MM-dd"),
                    label: format(date, "dd/MM/yyyy"),
                    valor: (i === num - 1 ? (baseVal + diff) : baseVal).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                };
            });
            setParcelasPreview(newParcelas);
        } catch (error) {
            console.error("Erro ao gerar preview de parcelas:", error);
            setParcelasPreview([]);
        }
    }, [form.valor_total, form.taxa_cadastro, form.num_parcelas, form.data_primeira_parcela, form.desconto_valor, form.desconto_tipo, form.is_permuta, form.permuta_amount]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        console.log("EditAutorizacaoModal: Invocando handleSubmit");
        
        if (!autorizacao?.id) {
            toast.error("ID da autorização não encontrado.");
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading("Salvando alterações...");

        try {
            const payload = {
                ...form,
                num_parcelas: parseInt(form.num_parcelas) || 1,
                valor_total: parseFloat(parseCurrency(form.valor_total)),
                taxa_cadastro: parseFloat(form.taxa_cadastro) || 0,
                desconto_valor: parseFloat(form.desconto_valor || "0") || 0,
                permuta_amount: parseFloat(parseCurrency(form.permuta_amount || "0")) || 0,
                is_permuta: !!form.is_permuta,
                parcelas: parcelasPreview.map(p => ({ vencimento: p.vencimento }))
            };

            console.log("EditAutorizacaoModal: Payload pronto", payload);

            await axios.put(`/v1/autorizacoes/${autorizacao.id}`, payload);
            toast.success("Contrato atualizado com sucesso!", { id: loadingToast });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("EditAutorizacaoModal: Erro no salvamento", error);
            const message = error.response?.data?.message || "Erro ao atualizar contrato.";
            toast.error(message, { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-y-auto rounded-[32px] p-0 border-none shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <div className="bg-gray-900 p-8 text-white sticky top-0 z-10">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30">
                                    <FileText className="text-white" size={24} />
                                </div>
                                <DialogTitle className="text-3xl font-black tracking-tight">Editar Contrato #{autorizacao?.numero}</DialogTitle>
                            </div>
                            <DialogDescription className="text-gray-400 font-medium">
                                Edição administrativa do contrato. Alterações refletirão no Tiny ERP se sincronizado.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-10">
                        {/* 1. CABEÇALHO CLIENTE */}
                        <div className="p-5 bg-blue-50 border-2 border-blue-100 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-md">
                                    <User size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Contratante / Cliente</p>
                                    <p className="text-xl font-black text-gray-900">{autorizacao?.cliente?.nome_fantasia || autorizacao?.cliente?.razao_social}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-blue-100">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Status Atual:</span>
                                <span className={cn(
                                    "text-xs font-black uppercase tracking-tight px-2 py-0.5 rounded-lg",
                                    autorizacao?.status === 'assinado' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                )}>
                                    {autorizacao?.status}
                                </span>
                            </div>
                        </div>
                        {autorizacao?.status === 'assinado' && (
                            <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-[24px]">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-red-900 tracking-tight">Atenção: Contrato Assinado</h4>
                                        <p className="text-sm font-medium text-red-700/90 mt-1 leading-relaxed">
                                            Como este contrato já está assinado, ao salvar estas alterações a autorização atual será <strong className="font-black text-red-900 uppercase">cancelada</strong> e uma <strong className="font-black text-red-900 uppercase">nova</strong> será gerada (status: Aguardando Assinatura).<br/><br/>
                                            <span className="font-bold underline decoration-red-300 underline-offset-2">Você precisará cancelar manualmente as faturas da autorização antiga no Tiny ERP.</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* COLUNA ESQUERDA: PUBLICIDADE E ASSINATURA */}
                            <div className="space-y-10">
                                {/* SEÇÃO: PUBLICIDADE */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">1</div>
                                        Publicidade & Veiculação
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Tipo de Publicidade</Label>
                                                <Select value={form.tipo_publicidade} onValueChange={(v) => handleSelectChange('tipo_publicidade', v)}>
                                                    <SelectTrigger className="rounded-2xl h-12 border-gray-100 bg-gray-50/50 font-bold focus:ring-blue-600">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl">
                                                        <SelectItem value="WEB">WEB / Portal</SelectItem>
                                                        <SelectItem value="REVISTA">Revista / Impresso</SelectItem>
                                                        <SelectItem value="RADIO">Rádio</SelectItem>
                                                        <SelectItem value="TV">TV</SelectItem>
                                                        <SelectItem value="OUTRO">Outro / Eventos</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Título do Anúncio</Label>
                                                <Input name="titulo_anuncio" value={form.titulo_anuncio} onChange={handleChange} className="rounded-2xl h-12 border-gray-100 bg-gray-50/50 font-bold" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Descrição / Detalhes da Veiculação</Label>
                                            <Textarea name="descricao_anuncio" value={form.descricao_anuncio} onChange={handleChange} className="rounded-2xl min-h-[100px] border-gray-100 bg-gray-50/50 font-medium" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Data Início</Label>
                                                <div className="relative">
                                                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <Input type="date" name="data_inicio" value={form.data_inicio} onChange={handleChange} className="rounded-2xl h-12 pl-12 border-gray-100 bg-gray-50/50 font-bold" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Data Fim</Label>
                                                <div className="relative">
                                                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <Input type="date" name="data_fim" value={form.data_fim} onChange={handleChange} className="rounded-2xl h-12 pl-12 border-gray-100 bg-gray-50/50 font-bold" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Observações do Anúncio (Interno)</Label>
                                            <Input name="observacoes_anuncio" value={form.observacoes_anuncio} onChange={handleChange} className="rounded-2xl h-12 border-gray-100 bg-gray-50/50" />
                                        </div>
                                    </div>
                                </div>

                                {/* SEÇÃO: RESPONSÁVEL */}
                                <div className="space-y-6 pt-6 border-t border-gray-100">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-black">2</div>
                                        Assinatura Digital
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nome do Responsável (Signatário)</Label>
                                            <div className="relative">
                                                <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <Input name="responsavel_nome" value={form.responsavel_nome} onChange={handleChange} className="rounded-2xl h-12 pl-12 border-gray-100 bg-gray-50/50 font-bold" placeholder="Nome completo de quem assina" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Preferência de Contato p/ Assinatura</Label>
                                            <Select value={form.responsavel_preferencia} onValueChange={(v) => handleSelectChange('responsavel_preferencia', v)}>
                                                <SelectTrigger className="rounded-2xl h-12 border-gray-100 bg-gray-50/50 font-bold">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl">
                                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                                    <SelectItem value="email">E-mail</SelectItem>
                                                    <SelectItem value="sms">SMS</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* COLUNA DIREITA: FINANCEIRO E PERMUTA */}
                            <div className="space-y-10">
                                {/* SEÇÃO: FINANCEIRO */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">3</div>
                                        Configuração Financeira
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Plano Vinculado</Label>
                                                <Select value={form.plan_id} onValueChange={(v) => handleSelectChange('plan_id', v)}>
                                                    <SelectTrigger className="rounded-2xl h-12 border-gray-100 bg-gray-50/50 font-bold">
                                                        <SelectValue placeholder="Selecione um plano" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl">
                                                        {plans.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Método de Pagamento</Label>
                                                <Select value={form.payment_method} onValueChange={(v) => handleSelectChange('payment_method', v)}>
                                                    <SelectTrigger className="rounded-2xl h-12 border-gray-100 bg-gray-50/50 font-bold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl">
                                                        <SelectItem value="pix">PIX / Dinheiro</SelectItem>
                                                        <SelectItem value="boleto">Boleto Bancário</SelectItem>
                                                        <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Valor Bruto Total (Contrato)</Label>
                                                <div className="relative">
                                                    <Landmark size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <Input name="valor_total" value={form.valor_total} onChange={handleCurrencyChange} className="rounded-2xl h-12 pl-12 border-gray-100 bg-gray-50/50 font-black text-lg" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Taxa de Cadastro</Label>
                                                <Input name="taxa_cadastro" type="number" value={form.taxa_cadastro} onChange={handleChange} className="rounded-2xl h-12 border-gray-100 bg-gray-50/50 font-bold text-center" />
                                            </div>
                                        </div>

                                        <button type="button" onClick={() => setShowDiscount(!showDiscount)} className="w-fit text-[10px] font-black text-red-600 uppercase flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">
                                            <Tag size={12} /> {showDiscount ? "Remover Desconto Especial" : "Deseja Aplicar Desconto?"}
                                        </button>
                                        
                                        {showDiscount && (
                                            <div className="flex gap-2 p-4 bg-red-50/50 rounded-2xl border border-red-100 animate-in zoom-in-95 duration-200">
                                                <div className="flex-1 space-y-1">
                                                    <Label className="text-[9px] font-black uppercase text-red-400">Valor Desconto</Label>
                                                    <Input name="desconto_valor" type="number" value={form.desconto_valor} onChange={handleChange} className="h-10 rounded-xl bg-white border-red-200 font-bold" />
                                                </div>
                                                <div className="flex bg-white rounded-xl border border-red-200 p-1 self-end">
                                                    <button type="button" onClick={() => handleSelectChange('desconto_tipo', 'fixed')} className={cn("px-3 py-1 rounded-lg text-[10px] font-bold transition-all", form.desconto_tipo === "fixed" ? "bg-red-600 text-white shadow-sm" : "text-gray-400")}>R$</button>
                                                    <button type="button" onClick={() => handleSelectChange('desconto_tipo', 'percent')} className={cn("px-3 py-1 rounded-lg text-[10px] font-bold transition-all", form.desconto_tipo === "percent" ? "bg-red-600 text-white shadow-sm" : "text-gray-400")}>%</button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nº de Parcelas</Label>
                                                <Select value={form.num_parcelas} onValueChange={(v) => handleSelectChange('num_parcelas', v)}>
                                                    <SelectTrigger className="rounded-2xl h-12 border-gray-100 bg-gray-50/50 font-black">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl font-bold">
                                                        {[1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24, 36].map(n => <SelectItem key={n} value={String(n)}>{n}x</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Vencimento da 1ª</Label>
                                                <div className="relative">
                                                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <Input type="date" name="data_primeira_parcela" value={form.data_primeira_parcela} onChange={handleChange} className="rounded-2xl h-12 pl-12 border-gray-100 bg-gray-50/50 font-bold" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Observações Financeiras (Interno)</Label>
                                            <Input name="observacoes_financeiro" value={form.observacoes_financeiro} onChange={handleChange} className="rounded-2xl h-12 border-gray-100 bg-gray-50/50" />
                                        </div>
                                    </div>
                                </div>

                                {/* SEÇÃO: PERMUTA */}
                                <div className="space-y-6 pt-6 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">4</div>
                                            Módulo de Permuta
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">{form.is_permuta ? 'Ativo' : 'Inativo'}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => setForm(p => ({ ...p, is_permuta: !p.is_permuta }))}
                                                className={cn(
                                                    "w-11 h-6 rounded-full transition-all relative",
                                                    form.is_permuta ? "bg-orange-600 shadow-md shadow-orange-200" : "bg-gray-200"
                                                )}
                                            >
                                                <div className={cn("absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all", form.is_permuta ? "translate-x-5" : "")} />
                                            </button>
                                        </div>
                                    </div>

                                    {form.is_permuta && (
                                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-orange-400 tracking-widest ml-1">Valor em Permuta (Abatimento)</Label>
                                                <Input name="permuta_amount" value={form.permuta_amount} onChange={handleCurrencyChange} className="rounded-2xl h-12 border-orange-100 bg-orange-50/30 font-black text-orange-700" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-orange-400 tracking-widest ml-1">Descrição dos itens permutados</Label>
                                                <Textarea name="permuta_description" value={form.permuta_description} onChange={handleChange} className="rounded-2xl border-orange-100 bg-orange-50/30" placeholder="Ex: Vales-compras, serviços de limpeza, etc" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* SEÇÃO: RESUMO FINAL */}
                                <div className="bg-gray-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                        <Calculator size={80} />
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Consolidado Financeiro</span>
                                    </div>

                                    <div className="space-y-4 relative z-10">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-gray-400">Total Bruto</span>
                                            <span className="font-black">R$ {totals.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        
                                        {(totals.discount > 0 || totals.taxa > 0) && (
                                            <div className="space-y-2 py-3 border-y border-white/5">
                                                {totals.discount > 0 && (
                                                    <div className="flex justify-between items-center text-sm text-green-400">
                                                        <span className="font-bold">Desconto</span>
                                                        <span className="font-black">- R$ {totals.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                )}
                                                {totals.taxa > 0 && (
                                                    <div className="flex justify-between items-center text-sm text-blue-400">
                                                        <span className="font-bold">Taxa de Cadastro</span>
                                                        <span className="font-black">+ R$ {totals.taxa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {totals.permuta > 0 && (
                                            <div className="flex justify-between items-center text-sm text-orange-400 font-bold">
                                                <span>Abatimento Permuta</span>
                                                <span>- R$ {totals.permuta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        )}

                                        <div className="pt-4 flex flex-col gap-1 items-end border-t border-white/10">
                                            <span className="text-[10px] font-black uppercase text-blue-500 tracking-tighter">Valor Final Líquido</span>
                                            <span className="text-4xl font-black tracking-tighter">R$ {totals.finalPayable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            <span className="text-xs font-bold text-gray-500">{form.num_parcelas} parcelas de R$ {totals.valParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* LISTA DE PARCELAS PREVIEW */}
                        <div className="space-y-6 pt-10 border-t border-gray-100">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center font-black">
                                    <Landmark size={18} />
                                </div>
                                Cronograma de Pagamento
                            </h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {parcelasPreview.map((p, i) => (
                                    <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col gap-1 hover:border-blue-200 transition-colors group">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tight group-hover:text-blue-600 transition-colors">Parcela {p.numero}</span>
                                        <span className="text-xs font-black text-gray-900">R$ {p.valor}</span>
                                        <span className="text-[10px] font-bold text-gray-500">{p.label}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="p-4 bg-amber-50 rounded-2xl flex items-start gap-3 border border-amber-100">
                                <Info className="text-amber-600 shrink-0 mt-0.5" size={18} />
                                <p className="text-[11px] text-amber-800 font-medium">
                                    <strong>Atenção:</strong> Ao salvar, se este contrato já possuir faturas geradas, elas <strong>serão recalculadas e atualizadas</strong> para refletir os novos valores e vencimentos definidos aqui.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-gray-50 rounded-b-[32px] border-t border-gray-100 gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl h-14 px-8 font-bold text-gray-400 hover:text-gray-900 transition-all uppercase text-xs">
                            Descartar Alterações
                        </Button>
                        <Button 
                            type="button" 
                            onClick={() => handleSubmit()}
                            disabled={isSubmitting} 
                            className="bg-gray-900 hover:bg-black text-white rounded-2xl h-14 px-12 font-black shadow-xl transition-all uppercase text-xs flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <RefreshCw className="animate-spin" size={18} />
                            ) : (
                                <Check size={18} />
                            )}
                            {isSubmitting ? "Sincronizando..." : "Atualizar Contrato"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
