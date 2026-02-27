import { useState } from "react";
import { Copy, Sparkles, TrendingUp, Users, Target, Search, AlertTriangle, MessageCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "@/services/api";

type Oportunidade = {
    id: number;
    termo: string;
    cidade: string;
    buscas: number;
    concorrentes: number;
    temperatura: "alta" | "media" | "emergente";
};


export default function OportunidadesPage() {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [pitchText, setPitchText] = useState("");

    const { data: radarData, isLoading } = useQuery({
        queryKey: ["radar-oportunidades"],
        queryFn: async () => {
            const resp = await axios.get("/v1/radar/oportunidades");
            return resp.data;
        },
    });

    const scriptMutation = useMutation({
        mutationFn: async (op: Oportunidade) => {
            const resp = await axios.post("/v1/radar/oportunidades/script", {
                termo: op.termo,
                cidade: op.cidade,
                buscas: op.buscas,
                concorrentes: op.concorrentes,
            });
            return resp.data.script;
        },
        onSuccess: (script) => {
            setPitchText(script);
        },
        onError: () => {
            toast.error("Erro ao gerar script com IA.");
        }
    });

    const handleProspectar = (op: Oportunidade) => {
        setSelectedId(op.id);
        setPitchText(""); // Limpa o anterior enquanto carrega
        scriptMutation.mutate(op);
    };

    const copyToWhatsApp = async () => {
        if (!pitchText) return;
        try {
            await navigator.clipboard.writeText(pitchText);
            toast.success("Script copiado com sucesso! 🎉");
        } catch {
            toast.error("Não foi possível copiar o script.");
        }
    };

    const getTempBadgeStyle = (temp: Oportunidade["temperatura"]) => {
        switch (temp) {
            case "alta": return "bg-red-50 text-red-700 border-red-100";
            case "media": return "bg-orange-50 text-orange-700 border-orange-100";
            case "emergente": return "bg-blue-50 text-blue-700 border-blue-100";
        }
    };

    const getTempLabel = (temp: Oportunidade["temperatura"]) => {
        switch (temp) {
            case "alta": return "Alta Demanda";
            case "media": return "Média Demanda";
            case "emergente": return "Emergente";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <header className="mb-8">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Radar Comercial</p>
                <h1 className="text-2xl font-black text-gray-900 tracking-tighter">Dashboard de Oportunidades</h1>
            </header>

            {/* BENTO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* ── CARD SUPERIOR: Cockpit de IA (col-span-full) ── */}
                <div className="md:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">✨ Radar de Oportunidades com IA</h2>
                            <p className="text-xs text-gray-400 font-medium">Buscando inteligência de mercado em tempo real</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1 max-w-2xl w-full">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Gaps Hoje</p>
                            <p className="text-2xl font-black text-gray-900 tracking-tighter">
                                {isLoading ? "..." : (radarData?.kpis?.gaps_hoje || 0)}
                            </p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">MRR Potencial</p>
                            <p className="text-2xl font-black text-emerald-900 tracking-tighter">
                                {isLoading ? "..." : (radarData?.kpis?.mrr_potencial || "R$ 0")}
                            </p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Convertidos</p>
                            <p className="text-2xl font-black text-blue-900 tracking-tighter">
                                {isLoading ? "..." : (radarData?.kpis?.convertidos || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── BLOCO PRINCIPAL: Lista de Gaps de Mercado (col-span-2) ── */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                                <Target size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Prospecção Ativa</p>
                                <p className="text-sm font-black text-gray-900">Oportunidades Quentes</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-3 relative">
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 backdrop-blur-sm rounded-xl">
                                <Loader2 className="animate-spin text-gray-400" size={32} />
                            </div>
                        )}
                        {(radarData?.oportunidades || []).map((op: Oportunidade) => (
                            <div
                                key={op.id}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.99] cursor-pointer group hover:bg-gray-50
                                    ${selectedId === op.id ? 'border-[#C00000] bg-red-50/20 shadow-sm' : 'border-gray-100 hover:border-gray-200'}
                                `}
                                onClick={() => handleProspectar(op)}
                            >
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-sm font-black text-gray-900 truncate">{op.termo}</h3>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getTempBadgeStyle(op.temperatura)}`}>
                                            {getTempLabel(op.temperatura)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2 truncate">📍 {op.cidade}</p>
                                    <div className="flex items-center gap-4 text-xs font-medium">
                                        <span className="flex items-center gap-1 text-red-600"><Search size={12} /> 🔥 {op.buscas} buscas/mês</span>
                                        <span className="flex items-center gap-1 text-orange-600"><AlertTriangle size={12} /> ⚠️ {op.concorrentes} empresa{op.concorrentes !== 1 ? 's' : ''} indexada{op.concorrentes !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleProspectar(op);
                                    }}
                                    disabled={scriptMutation.isPending && selectedId === op.id}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50
                                        ${selectedId === op.id
                                            ? 'bg-red-100 text-[#C00000] border border-red-200'
                                            : 'bg-[#C00000] text-white hover:bg-red-700 hover:shadow-md'}
                                    `}
                                >
                                    {(scriptMutation.isPending && selectedId === op.id) ? (
                                        <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={14} /> Gerando...</span>
                                    ) : '🎯 Prospectar'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── BLOCO LATERAL: Gerador de Pitch via IA (col-span-1) ── */}
                <div className="md:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-8 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                            <MessageCircle size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sugestão da Inteligência</p>
                            <p className="text-sm font-black text-gray-900">Script de Vendas</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col h-full bg-gray-50 rounded-xl border border-gray-100 overflow-hidden relative">
                        {scriptMutation.isPending ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400">
                                <Loader2 size={32} className="animate-spin text-purple-400 mb-3" />
                                <p className="text-xs font-medium text-purple-600">A Inteligência está formulando um pitch matador...</p>
                            </div>
                        ) : pitchText ? (
                            <>
                                <div className="p-4 flex-1 text-sm text-gray-700 leading-relaxed overflow-y-auto w-full max-w-none break-words">
                                    {pitchText.split('\n').map((line, idx) => (
                                        <span key={idx}>
                                            {line}
                                            <br />
                                        </span>
                                    ))}
                                </div>
                                <div className="p-4 border-t border-gray-100 bg-white">
                                    <button
                                        onClick={copyToWhatsApp}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-green-600 active:scale-95 transition-all shadow-sm hover:shadow-md"
                                    >
                                        <Copy size={16} />
                                        Copiar p/ WhatsApp
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400">
                                <Target size={32} className="text-gray-200 mb-3" />
                                <p className="text-xs font-medium">Selecione uma oportunidade na lista ao lado para gerar o script de prospecção ideal.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
