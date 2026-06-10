import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/services/api";
import {
    MessageSquare,
    Smartphone,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    User,
    ArrowRight,
    Search,
    BrainCircuit,
    Send,
    Mail
} from "lucide-react";
import toast from "react-hot-toast";

interface Quote {
    id: number;
    cliente_id: number;
    customer_name: string;
    customer_whatsapp: string;
    service_requested: string;
    urgency: 'pesquisa' | 'semana' | 'emergencia';
    status: 'new' | 'replied' | 'closed';
    ai_draft_response: string | null;
    created_at: string;
}

interface QuotesFocusFilaProps {
    clienteId: number;
}

export default function QuotesFocusFila({ clienteId }: QuotesFocusFilaProps) {
    const queryClient = useQueryClient();
    const [focusedAiResponse, setFocusedAiResponse] = useState("");

    const { data: quotes = [], isLoading } = useQuery<Quote[]>({
        queryKey: ["quotes-focus", clienteId],
        queryFn: async () => {
            const resp = await axios.get(`/v1/clients/${clienteId}/quotes-focus`);
            return resp.data;
        },
        // Polling para checar se a IA terminou de gerar a resposta
        refetchInterval: 5000
    });

    const activeQuote = quotes[0] || null;
    const pendingQuotes = quotes.slice(1);

    useEffect(() => {
        if (activeQuote?.ai_draft_response) {
            setFocusedAiResponse(activeQuote.ai_draft_response);
        } else {
            setFocusedAiResponse("");
        }
    }, [activeQuote?.id, activeQuote?.ai_draft_response]);

    const updateStatusMutation = useMutation({
        mutationFn: async (quoteId: number) => {
            await axios.patch(`/v1/quotes/${quoteId}/status`, { status: "replied" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quotes-focus", clienteId] });
            toast.success("Status atualizado!");
        }
    });

    const isEmail = activeQuote?.customer_whatsapp.includes("@");

    const handleSend = () => {
        if (!activeQuote) return;

        if (isEmail) {
            const subject = encodeURIComponent(`Orçamento - O Vermelhinho`);
            const body = encodeURIComponent(focusedAiResponse);
            const url = `mailto:${activeQuote.customer_whatsapp}?subject=${subject}&body=${body}`;
            window.open(url, "_self");
        } else {
            const fone = activeQuote.customer_whatsapp.replace(/\D/g, "");
            const msg = encodeURIComponent(focusedAiResponse);
            const url = `https://wa.me/55${fone}?text=${msg}`;
            window.open(url, "_blank");
        }
        updateStatusMutation.mutate(activeQuote.id);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#C00000]" />
            </div>
        );
    }

    if (quotes.length === 0) {
        return (
            <div className="bg-[#F2F2F2] p-12 rounded-[40px] border-4 border-white shadow-inner flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-gray-200 mb-6 shadow-sm">
                    <CheckCircle2 size={40} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Fila de Foco Vazia</h3>
                <p className="text-gray-500 font-medium max-w-xs">Parabéns! Você respondeu a todos os orçamentos recentes.</p>
            </div>
        );
    }

    const urgencyInfo = {
        emergencia: { label: "Emergência", color: "bg-red-500", icon: AlertTriangle },
        semana: { label: "Esta Semana", color: "bg-orange-500", icon: Clock },
        pesquisa: { label: "Cotação", color: "bg-blue-500", icon: MessageSquare },
    };

    const urgency = activeQuote ? urgencyInfo[activeQuote.urgency] : null;
    const UrgencyIcon = urgency?.icon || AlertTriangle;

    return (
        <div className="bg-[#F2F2F2] min-h-[600px] p-8 rounded-[40px] border-4 border-white shadow-2xl">
            {/* Header Fila de Foco */}
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Smartphone className="text-[#C00000]" />
                        Fila de Foco
                    </h2>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">Produtividade Máxima com IA</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Total na Fila</p>
                        <p className="text-xl font-black text-gray-900">{quotes.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-[#C00000]">
                        <Search size={20} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Lado Esquerdo: Card em Foco (Bento Style) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-white relative overflow-hidden group">
                        {/* Indicador de Urgência Lateral */}
                        <div className={`absolute left-0 top-0 bottom-0 w-2 ${urgency?.color}`} />

                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                            <div className="flex items-start gap-5">
                                <div className="w-16 h-16 bg-gray-50 rounded-[22px] flex items-center justify-center text-gray-400 border border-gray-100">
                                    <User size={30} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 leading-tight mb-1">{activeQuote?.customer_name}</h3>
                                    <div className="flex items-center gap-2">
                                        {isEmail ? (
                                            <>
                                                <Mail size={14} className="text-blue-500" />
                                                <span className="text-sm font-bold text-gray-600">{activeQuote?.customer_whatsapp}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Smartphone size={14} className="text-green-500" />
                                                <span className="text-sm font-bold text-gray-600">{activeQuote?.customer_whatsapp}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-white font-black text-[10px] uppercase tracking-wider ${urgency?.color}`}>
                                <UrgencyIcon size={14} />
                                {urgency?.label}
                            </div>
                        </div>

                        <div className="mt-8">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Serviço Solicitado</p>
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 italic text-gray-700 font-medium leading-relaxed">
                                "{activeQuote?.service_requested}"
                            </div>
                        </div>

                        {/* IA Section */}
                        <div className="mt-10 pt-10 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="bg-red-50 p-1.5 rounded-lg text-[#C00000]">
                                        <BrainCircuit size={18} />
                                    </div>
                                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Rascunho da IA (Editável)</span>
                                </div>
                                {!activeQuote?.ai_draft_response && (
                                    <div className="flex items-center gap-2 animate-pulse">
                                        <Loader2 size={12} className="animate-spin text-gray-400" />
                                        <span className="text-[10px] font-bold text-gray-400">Gerando...</span>
                                    </div>
                                )}
                            </div>

                            <textarea
                                value={focusedAiResponse}
                                onChange={(e) => setFocusedAiResponse(e.target.value)}
                                placeholder="Aguardando rascunho da IA..."
                                className="w-full h-48 p-6 bg-red-50/10 border-2 border-red-50/50 rounded-3xl focus:ring-4 focus:ring-red-500/5 focus:border-[#C00000] transition-all outline-none text-sm font-semibold leading-relaxed text-gray-800 placeholder:text-red-100/50"
                            />
                        </div>

                        {/* Gimme Gummy Button */}
                        <div className="mt-8">
                            <button
                                onClick={handleSend}
                                className="w-full h-20 bg-[#C00000] text-white rounded-[30px] font-black text-lg shadow-xl shadow-red-200 hover:bg-[#a00000] active:scale-95 transition-all flex items-center justify-center gap-4 group"
                            >
                                <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                {isEmail ? 'Enviar Resposta via E-mail' : 'Enviar Resposta via WhatsApp'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Direita: Próximos na Fila */}
                <div className="lg:col-span-4 space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-4">Próximos em Foco</h4>
                    <div className="space-y-4">
                        {pendingQuotes.length > 0 ? pendingQuotes.map((q, idx) => {
                            const u = urgencyInfo[q.urgency];
                            return (
                                <div key={q.id} className="bg-white p-5 rounded-[24px] shadow-sm border border-white hover:border-gray-200 transition-all cursor-default group">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 border border-gray-100">
                                                <User size={16} />
                                            </div>
                                            <span className="font-bold text-gray-900 text-sm">{q.customer_name}</span>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${u.color}`} />
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium line-clamp-2 leading-relaxed">
                                        {q.service_requested}
                                    </p>
                                    <div className="mt-4 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] font-black text-[#C00000] uppercase tracking-widest flex items-center gap-1">
                                            Aguarde <ArrowRight size={10} />
                                        </span>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="bg-white/50 p-8 rounded-[24px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center opacity-60">
                                <Clock size={24} className="text-gray-300 mb-2" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Fim da<br />Fila</span>
                            </div>
                        )}
                    </div>

                    {/* Dica de Produtividade */}
                    <div className="mt-8 bg-gradient-to-br from-gray-900 to-black p-6 rounded-[28px] text-white">
                        <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                            <BrainCircuit size={20} />
                        </div>
                        <h5 className="font-black text-sm mb-1 uppercase tracking-wider">Poder da IA</h5>
                        <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                            A IA redige o rascunho com base na urgência e no serviço solicitado.
                            Revise e pressione o botão vermelho para disparar o WhatsApp instantaneamente.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
