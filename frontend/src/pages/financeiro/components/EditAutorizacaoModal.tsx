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
import { Calculator, Calendar, FileText, Check, User, Tag, ChevronUp, ChevronDown } from "lucide-react";
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
            });

            if (autorizacao.desconto_valor > 0) setShowDiscount(true);
            
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

    const handleParcelaDateChange = (index: number, newDate: string) => {
        if (!newDate) return;
        const parts = newDate.split("-");
        if (parts.length !== 3) return;

        const updated = [...parcelasPreview];
        const [y, m, d] = parts.map(Number);
        const date = new Date(y, m - 1, d);
        
        if (isNaN(date.getTime())) return;

        updated[index].vencimento = newDate;
        updated[index].label = format(date, "dd/MM/yyyy");
        setParcelasPreview(updated);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        toast("Iniciando salvamento...");
        console.log("EditAutorizacaoModal: handleSubmit triggered");
        
        if (!autorizacao) {
            console.log("EditAutorizacaoModal: autorizacao is null");
            return;
        }

        setIsSubmitting(true);
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

            console.log("EditAutorizacaoModal: Sending payload", payload);

            await axios.put(`/v1/autorizacoes/${autorizacao.id}`, payload);
            toast.success("Contrato atualizado com sucesso!");
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("EditAutorizacaoModal: Submit error", error);
            const message = error.response?.data?.message || "Erro ao atualizar contrato.";
            const errors = error.response?.data?.errors;
            
            if (errors) {
                const firstError = Object.values(errors)[0] as string[];
                toast.error(`${message}: ${firstError[0]}`);
            } else {
                toast.error(message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
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
                                Alterações permitidas apenas enquanto o contrato não foi assinado.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* 1. CLIENTE (Nesta modal apenas visualização) */}
                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-200 rounded-xl text-blue-700">
                                    <User size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-blue-800 uppercase tracking-widest">Contratante</p>
                                    <p className="text-lg font-black text-gray-900">{autorizacao?.cliente?.nome_fantasia}</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. PUBLICIDADE */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                                    Publicidade
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Título do Anúncio</Label>
                                        <Input name="titulo_anuncio" value={form.titulo_anuncio} onChange={handleChange} className="rounded-xl h-11 border-gray-200 font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Descrição</Label>
                                        <Textarea name="descricao_anuncio" value={form.descricao_anuncio} onChange={handleChange} className="rounded-xl min-h-[100px] border-gray-200 font-bold" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Início</Label>
                                            <Input type="date" name="data_inicio" value={form.data_inicio} onChange={handleChange} className="rounded-xl h-11" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Fim</Label>
                                            <Input type="date" name="data_fim" value={form.data_fim} onChange={handleChange} className="rounded-xl h-11" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                                    Investimento
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Valor Bruto</Label>
                                            <Input name="valor_total" value={form.valor_total} onChange={handleCurrencyChange} className="rounded-xl h-11 font-black" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Taxa</Label>
                                            <Input name="taxa_cadastro" type="number" value={form.taxa_cadastro} onChange={handleChange} className="rounded-xl h-11" />
                                        </div>
                                    </div>

                                    <button type="button" onClick={() => setShowDiscount(!showDiscount)} className="text-[10px] font-black text-red-600 uppercase flex items-center gap-1">
                                        <Tag size={12} /> {showDiscount ? "Remover Desconto" : "Aplicar Desconto?"}
                                    </button>
                                    
                                    {showDiscount && (
                                        <div className="flex gap-2 p-3 bg-gray-50 rounded-2xl border">
                                            <Input name="desconto_valor" type="number" value={form.desconto_valor} onChange={handleChange} className="h-10 rounded-xl" />
                                            <div className="flex bg-white rounded-xl border p-1">
                                                <button type="button" onClick={() => handleSelectChange('desconto_tipo', 'fixed')} className={cn("px-3 py-1 rounded-lg text-[10px] font-bold", form.desconto_tipo === "fixed" ? "bg-blue-600 text-white" : "text-gray-400")}>R$</button>
                                                <button type="button" onClick={() => handleSelectChange('desconto_tipo', 'percent')} className={cn("px-3 py-1 rounded-lg text-[10px] font-bold", form.desconto_tipo === "percent" ? "bg-blue-600 text-white" : "text-gray-400")}>%</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Parcelas</Label>
                                            <Select value={form.num_parcelas} onValueChange={(v) => handleSelectChange('num_parcelas', v)}>
                                                <SelectTrigger className="rounded-xl h-11 font-bold"><SelectValue /></SelectTrigger>
                                                <SelectContent className="font-bold">
                                                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24, 36].map(n => <SelectItem key={n} value={String(n)}>{n}x</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Data 1ª</Label>
                                            <Input type="date" name="data_primeira_parcela" value={form.data_primeira_parcela} onChange={handleChange} className="rounded-xl h-11" />
                                        </div>
                                    </div>
                                </div>

                                {/* Resumo Financeiro */}
                                <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl">
                                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
                                        <Calculator size={14} className="text-blue-500" />
                                        <span className="text-[10px] font-black uppercase">Resumo Final</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[11px] font-bold text-gray-400"><span>Subtotal</span><span>R$ {totals.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                        {totals.discount > 0 && <div className="flex justify-between text-[11px] font-bold text-green-400"><span>Desconto</span><span>- R$ {totals.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>}
                                        <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/10"><span>A Pagar</span><span>R$ {totals.finalPayable.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                        <div className="text-[10px] text-gray-400 text-right italic">{form.num_parcelas}x de R$ {totals.valParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-gray-50 rounded-b-3xl border-t border-gray-100">
                        <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancelar</Button>
                        <Button 
                            type="button" 
                            onClick={() => handleSubmit()}
                            disabled={isSubmitting} 
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 font-black shadow-lg shadow-blue-600/20"
                        >
                            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
