import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "@/services/api";
import {
    CheckCircle,
    AlertTriangle,
    Building2,
    MapPin,
    Phone,
    Mail,
    Loader2,
    RefreshCw,
    Facebook,
    Instagram,
    Linkedin,
    Youtube,
    Twitter,
    Globe,
    Clock,
    CreditCard,
    Bike,
    Utensils,
    Smartphone,
    Banknote,
    Coins,
    DollarSign,
    Briefcase
} from "lucide-react";
import toast from "react-hot-toast";

export default function RenewalMagicLinkPage() {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [renewal, setRenewal] = useState<any>(null);
    const [status, setStatus] = useState<"idle" | "success" | "editing">("idle");
    const [suggestedChanges, setSuggestedChanges] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function fetchRenewal() {
            try {
                const { data } = await axios.get(`/v1/renewals/magic-link/${token}`);
                setRenewal(data);
            } catch (error) {
                toast.error("Link inválido ou expirado.");
            } finally {
                setLoading(false);
            }
        }
        fetchRenewal();
    }, [token]);

    const handleApprove = async () => {
        setSubmitting(true);
        try {
            await axios.post(`/v1/renewals/magic-link/${token}/approve`);
            setStatus("success");
            toast.success("Renovação confirmada!");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Erro ao confirmar renovação.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateData = async () => {
        if (!suggestedChanges.trim()) {
            toast.error("Por favor, descreva as alterações necessárias.");
            return;
        }
        setSubmitting(true);
        try {
            await axios.post(`/v1/renewals/magic-link/${token}/update-data`, {
                suggested_changes: suggestedChanges,
            });
            setStatus("success");
            toast.success("Solicitação enviada!");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Erro ao enviar solicitação.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-[#C00000]" />
            </div>
        );
    }

    if (!renewal) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border text-center max-w-sm">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Ops! Link Inválido</h1>
                    <p className="text-gray-600">Este link de renovação não existe ou já foi utilizado.</p>
                </div>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border text-center max-w-md">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Obrigado!</h1>
                    <p className="text-gray-600 mb-6">
                        Sua solicitação foi processada com sucesso. Nossa equipe entrará em contato em breve para finalizar os detalhes.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-500">
                        Você já pode fechar esta aba.
                    </div>
                </div>
            </div>
        );
    }

    const cliente = renewal.cliente;
    const endereco = cliente?.enderecos?.[0];
    const contatos = cliente?.contatos || [];
    const redesSociais = cliente?.redes_sociais || [];
    const beneficiosList = Array.isArray(cliente?.beneficios) ? cliente.beneficios : [];

    const beneficioMap: Record<string, { label: string; icon: any }> = {
        "24h": { label: "24 horas", icon: Clock },
        "tele_entrega": { label: "Tele-entrega", icon: Bike },
        "meio_dia": { label: "Aberto ao meio-dia", icon: Utensils },
        "credito": { label: "Crédito", icon: CreditCard },
        "debito": { label: "Débito", icon: DollarSign },
        "pix": { label: "Pix", icon: Smartphone },
        "boleto": { label: "Boleto Bancário", icon: Banknote },
        "dinheiro": { label: "Dinheiro", icon: Coins },
    };

    const redeMap: Record<string, { label: string; icon: any; color: string }> = {
        facebook: { label: "Facebook", icon: Facebook, color: "text-[#1877F2]" },
        instagram: { label: "Instagram", icon: Instagram, color: "text-[#E4405F]" },
        linkedin: { label: "Linkedin", icon: Linkedin, color: "text-[#0A66C2]" },
        youtube: { label: "Youtube", icon: Youtube, color: "text-[#FF0000]" },
        tiktok: { label: "Tiktok", icon: Smartphone, color: "text-[#000000]" },
        twitter: { label: "Twitter", icon: Twitter, color: "text-[#1DA1F2]" },
        x: { label: "X", icon: Globe, color: "text-black" },
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12 font-sans">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#C00000] to-[#8B0000] text-white p-6 pt-10 pb-20">
                <div className="max-w-md mx-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest opacity-80">Renovação Anual</span>
                    </div>
                    <h1 className="text-2xl font-black mb-1">Confirme seus Dados</h1>
                    <p className="text-red-100 opacity-90 text-sm">Mantenha sua empresa em destaque em Cambará do Sul.</p>
                </div>
            </div>

            <div className="max-w-md mx-auto -mt-12 px-4 space-y-4">
                {status === "idle" ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* 1. Empresa e Identificação */}
                        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 border border-white">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-red-50 p-2.5 rounded-2xl">
                                    <Building2 className="w-6 h-6 text-[#C00000]" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 leading-tight">{cliente?.nome_fantasia || "Sua Empresa"}</h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">CNPJ: {cliente?.cpf_cnpj || "Não informado"}</p>
                                </div>
                            </div>

                            {/* Endereço */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-gray-50 p-2 rounded-xl mt-0.5">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Endereço Completo</p>
                                        <p className="text-sm text-gray-700 font-semibold leading-relaxed lowercase first-letter:uppercase">
                                            {endereco ? (
                                                <>
                                                    {endereco.rua}, {endereco.numero} {endereco.complemento && `(${endereco.complemento})`}<br />
                                                    {endereco.bairro} • {endereco.cep}<br />
                                                    {endereco.cidade} - {endereco.estado}
                                                </>
                                            ) : (
                                                "Endereço não cadastrado"
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Contatos */}
                        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 border border-white">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-[#C00000]" /> Canais de Contato
                            </h3>

                            <div className="grid grid-cols-1 gap-5">
                                {contatos.length > 0 ? contatos.map((cont: any, idx: number) => (
                                    <div key={idx} className="space-y-3">
                                        {cont.telefone_principal && (
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                                    <Phone className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Telefone Principal</p>
                                                    <p className="text-sm text-gray-900 font-bold">{cont.telefone_principal}</p>
                                                </div>
                                            </div>
                                        )}
                                        {cont.celular && (
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                                                    <Smartphone className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp / Celular</p>
                                                    <p className="text-sm text-gray-900 font-bold">{cont.celular}</p>
                                                </div>
                                            </div>
                                        )}
                                        {cont.email_principal && (
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                                                    <Mail className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">E-mail Comercial</p>
                                                    <p className="text-sm text-gray-900 font-bold break-all">{cont.email_principal}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-400 italic">Nenhum contato cadastrado.</p>
                                )}
                            </div>
                        </div>

                        {/* 3. Redes Sociais */}
                        {redesSociais.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 border border-white">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-[#C00000]" /> Presença Digital
                                </h3>

                                <div className="grid grid-cols-4 gap-4">
                                    {redesSociais.map((rede: any, idx: number) => {
                                        const info = redeMap[rede.tipo?.toLowerCase()] || { label: rede.tipo, icon: Globe, color: "text-gray-400" };
                                        const Icon = info.icon;
                                        return (
                                            <div key={idx} className="flex flex-col items-center gap-2">
                                                <div className={`w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center ${info.color} border border-gray-100`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-500">{info.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 4. Benefícios e Pagamento */}
                        {beneficiosList.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 border border-white">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-[#C00000]" /> Diferenciais e Pagamento
                                </h3>

                                <div className="flex flex-wrap gap-2">
                                    {beneficiosList.map((ben: string, idx: number) => {
                                        const info = beneficioMap[ben] || { label: ben, icon: Briefcase };
                                        const Icon = info.icon;
                                        return (
                                            <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                                                <Icon className="w-4 h-4 text-[#C00000]" />
                                                <span className="text-xs font-bold text-gray-600">{info.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 5. Horário de Funcionamento */}
                        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 border border-white">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#C00000]" /> Horário de Atendimento
                            </h3>

                            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-50">
                                <p className="text-sm text-red-900 font-semibold italic">
                                    {Array.isArray(cliente?.horario_atendimento) ? (
                                        <div className="space-y-1">
                                            {cliente.horario_atendimento.map((s: any) => (
                                                !s.closed && (
                                                    <div key={s.day} className="flex justify-between text-[11px] font-bold text-red-900/70 border-b border-red-100/50 pb-1 last:border-0">
                                                        <span>{{1:'Segunda', 2:'Terça', 3:'Quarta', 4:'Quinta', 5:'Sexta', 6:'Sábado', 7:'Domingo'}[s.day as number]}:</span>
                                                        <span>{s.open} - {s.close}{s.open2 && ` / ${s.open2} - ${s.close2}`}</span>
                                                    </div>
                                                )
                                            ))}
                                            {cliente.horario_atendimento.every((s: any) => s.closed) && "Fechado todos os dias."}
                                        </div>
                                    ) : "Horário não informado."}
                                </p>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-50 flex justify-center text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                                Expira em: {new Date(renewal.expiration_date).toLocaleDateString('pt-BR')}
                            </div>
                        </div>

                        {/* Ações */}
                        <div className="space-y-3 pt-4">
                            <button
                                onClick={handleApprove}
                                disabled={submitting}
                                className="w-full h-16 bg-[#C00000] text-white rounded-[24px] font-black text-lg shadow-xl shadow-red-200 hover:bg-[#a00000] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                    <>
                                        <CheckCircle className="w-6 h-6" />
                                        Confirmar Renovação
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => setStatus("editing")}
                                disabled={submitting}
                                className="w-full h-14 bg-white text-gray-500 rounded-[24px] font-black uppercase text-xs tracking-widest border-2 border-transparent hover:bg-gray-100 transition-all flex items-center justify-center"
                            >
                                Solicitar Ajustes nos Dados
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-[32px] shadow-2xl p-8 border border-white animate-in zoom-in duration-300">
                        <h2 className="text-xl font-black text-gray-900 mb-2">O que deseja ajustar?</h2>
                        <p className="text-sm text-gray-500 mb-6 font-medium">Nossa equipe receberá sua mensagem e atualizará seu cadastro imediatamente.</p>

                        <textarea
                            value={suggestedChanges}
                            onChange={(e) => setSuggestedChanges(e.target.value)}
                            placeholder="Ex: Mudamos o telefone para (54) 9... ou o endereço agora é na Rua..."
                            className="w-full h-40 p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl focus:ring-4 focus:ring-red-500/10 focus:border-[#C00000] transition-all outline-none text-sm font-semibold resize-none mb-8 placeholder:text-gray-300"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStatus("idle")}
                                className="flex-1 h-14 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleUpdateData}
                                disabled={submitting}
                                className="flex-[2] h-14 bg-[#C00000] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-100 flex items-center justify-center"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar Atualização"}
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-12 text-center pb-8">
                    <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.3em]">© O Vermelhinho Express • 2024</p>
                </div>
            </div>
        </div>
    );
}
