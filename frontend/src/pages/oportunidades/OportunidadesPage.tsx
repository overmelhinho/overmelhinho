import { useState } from "react";
import { Copy, Sparkles, TrendingUp, Users, Target, Search, AlertTriangle, MessageCircle, Loader2, Check, ExternalLink, MapPin } from "lucide-react";
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
    status?: "pendente" | "prospectado";
};

type TargetAlvo = {
    place_id: string;
    name: string;
    address: string;
    rating: number;
    user_ratings_total: number;
    status?: "pendente" | "prospectado";
};


export default function OportunidadesPage() {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [selectedOp, setSelectedOp] = useState<Oportunidade | null>(null);
    const [pitchText, setPitchText] = useState("");
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<"all" | "pendente" | "prospectado">("all");

    const { data: radarData, isLoading, refetch } = useQuery({
        queryKey: ["radar-oportunidades", page, statusFilter],
        queryFn: async () => {
            const resp = await axios.get(`/v1/radar/oportunidades?page=${page}&status=${statusFilter}&per_page=6`);
            return resp.data;
        },
    });

    const { data: roiData, isLoading: isLoadingRoi } = useQuery({
        queryKey: ["radar-roi"],
        queryFn: async () => {
            const resp = await axios.get("/v1/radar/roi");
            return resp.data;
        }
    });

    // Busca Alvos (Empresas Reais) no Google
    const { data: targets, isLoading: isLoadingTargets, refetch: refetchTargets } = useQuery({
        queryKey: ["radar-targets", selectedOp?.termo, selectedOp?.cidade],
        enabled: !!selectedOp,
        queryFn: async () => {
            const resp = await axios.get(`/v1/radar/oportunidades/alvos?termo=${selectedOp?.termo}&cidade=${selectedOp?.cidade}`);
            return resp.data.targets as TargetAlvo[];
        }
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

    const prospectMutation = useMutation({
        mutationFn: async (op: Oportunidade) => {
            await axios.post("/v1/radar/oportunidades/prospectar", {
                termo: op.termo,
                cidade: op.cidade
            });
        },
        onSuccess: () => {
            refetch(); // Atualiza a lista para mostrar o botão verde
        }
    });

    const prospectTargetMutation = useMutation({
        mutationFn: async (target: TargetAlvo & { phone?: string }) => {
            await axios.post("/v1/radar/oportunidades/alvos/prospectar", {
                place_id: target.place_id,
                name: target.name,
                phone: target.phone,
                termo: selectedOp?.termo,
                cidade: selectedOp?.cidade
            });
        },
        onSuccess: () => {
            refetchTargets();
        }
    });

    const targetDetailsMutation = useMutation({
        mutationFn: async (place_id: string) => {
            const resp = await axios.get(`/v1/radar/oportunidades/alvos/detalhes?place_id=${place_id}`);
            return resp.data.details;
        }
    });

    const handleProspectar = (op: Oportunidade) => {
        setSelectedId(op.id);
        setSelectedOp(op);
        setPitchText(""); // Limpa o anterior enquanto carrega
        scriptMutation.mutate(op);

        // Se ainda não estiver prospectado, marca agora
        if (op.status !== "prospectado") {
            prospectMutation.mutate(op);
        }
    };

    const handleCallTarget = async (target: TargetAlvo) => {
        if (!pitchText) {
            toast.error("Aguarde a geração do script...");
            return;
        }

        const id = toast.loading(`Buscando contato de ${target.name}...`);
        try {
            const details = await targetDetailsMutation.mutateAsync(target.place_id);
            toast.dismiss(id);

            // Marca como prospectado no banco e cria LEAD no Kanban
            if (target.status !== 'prospectado') {
                prospectTargetMutation.mutate({
                    ...target,
                    phone: details.whatsapp || details.phone
                });
            }

            if (details.whatsapp) {
                const url = `https://wa.me/${details.whatsapp}?text=${encodeURIComponent(pitchText)}`;
                window.open(url, '_blank');
            } else {
                toast.error("WhatsApp não encontrado. Tente o site ou telefone fixo.");
                if (details.website) window.open(details.website, '_blank');
            }
        } catch (e) {
            toast.dismiss(id);
            toast.error("Erro ao obter detalhes da empresa.");
        }
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

                {/* ── CARD SUPERIOR: Cockpit de IA & ROI ── */}
                <div className="md:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-8 flex flex-col items-center gap-8">
                    <div className="flex flex-col md:flex-row items-center justify-between w-full gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900 tracking-tight">✨ Radar de Oportunidades & ROI</h2>
                                <p className="text-xs text-gray-400 font-medium">Inteligência de mercado e performance comercial</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 max-w-4xl w-full">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Gaps Hoje</p>
                                <p className="text-xl font-black text-gray-900 tracking-tighter">
                                    {isLoading ? "..." : (radarData?.kpis?.gaps_hoje || 0)}
                                </p>
                            </div>
                            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Conversão</p>
                                <p className="text-xl font-black text-emerald-900 tracking-tighter">
                                    {isLoadingRoi ? "..." : `${roiData?.taxa_conversao || 0}%`}
                                </p>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">MRR Real</p>
                                <p className="text-xl font-black text-blue-900 tracking-tighter">
                                    {isLoadingRoi ? "..." : `R$ ${Intl.NumberFormat('pt-BR').format(roiData?.mrr_total || 0)}`}
                                </p>
                            </div>
                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-1">Ticket Médio</p>
                                <p className="text-xl font-black text-purple-900 tracking-tighter">
                                    {isLoadingRoi ? "..." : `R$ ${Intl.NumberFormat('pt-BR').format(roiData?.ticket_medio || 0)}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400">Leads Radar</p>
                                <p className="text-lg font-black text-gray-900">{roiData?.total_leads || 0}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-l border-gray-100 pl-8">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400">MRR Potencial (Gap)</p>
                                <p className="text-lg font-black text-gray-900">{radarData?.kpis?.mrr_potencial || "R$ 0"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-l border-gray-100 pl-8">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                <Check size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400">Vendas Ganhas</p>
                                <p className="text-lg font-black text-gray-900">{roiData?.conversoes || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── BLOCO PRINCIPAL: Lista de Gaps de Mercado (col-span-2) ── */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-8 flex flex-col min-h-[500px]">
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

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value as any);
                                    setPage(1);
                                }}
                                className="h-9 border-gray-200 rounded-xl text-xs font-bold bg-white px-3 focus:ring-2 focus:ring-[#C00000] focus:border-[#C00000] outline-none"
                            >
                                <option value="all">Todas</option>
                                <option value="pendente">Pendentes</option>
                                <option value="prospectado">Prospectadas</option>
                            </select>
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
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 min-w-[120px]
                                        ${op.status === 'prospectado'
                                            ? 'bg-emerald-500 text-white shadow-emerald-100 hover:bg-emerald-600'
                                            : selectedId === op.id
                                                ? 'bg-red-100 text-[#C00000] border border-red-200'
                                                : 'bg-[#C00000] text-white hover:bg-red-700 hover:shadow-md'}
                                    `}
                                >
                                    {(scriptMutation.isPending && selectedId === op.id) ? (
                                        <span className="flex items-center gap-2 justify-center"><Loader2 className="animate-spin" size={14} /> Gerando...</span>
                                    ) : op.status === 'prospectado' ? (
                                        <span className="flex items-center gap-2 justify-center"><Check size={14} /> Prospectado</span>
                                    ) : (
                                        <span className="flex items-center gap-2 justify-center">🎯 Prospectar</span>
                                    )}
                                </button>
                            </div>
                        ))}

                        {radarData?.oportunidades?.length === 0 && !isLoading && (
                            <div className="p-12 text-center text-gray-400">
                                <Search size={48} className="mx-auto mb-4 opacity-10" />
                                <p className="font-bold text-sm">Nenhuma oportunidade encontrada com este filtro.</p>
                            </div>
                        )}
                    </div>

                    {/* Controles de Paginação */}
                    {radarData?.pagination && radarData.pagination.last_page > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-4 border-t border-gray-100 pt-6">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-[#C00000] disabled:text-gray-300 transition-colors"
                            >
                                Anterior
                            </button>
                            <span className="text-xs font-black text-gray-500">
                                {page} de {radarData.pagination.last_page}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(radarData.pagination.last_page, p + 1))}
                                disabled={page === radarData.pagination.last_page}
                                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-[#C00000] disabled:text-gray-300 transition-colors"
                            >
                                Próxima
                            </button>
                        </div>
                    )}
                </div>

                {/* ── BLOCO LATERAL: Gerador de Pitch via IA (col-span-1) ── */}
                <div className="md:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-8 flex flex-col h-fit sticky top-24">
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
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400 min-h-[150px]">
                                <Loader2 size={32} className="animate-spin text-purple-400 mb-3" />
                                <p className="text-xs font-medium text-purple-600">A Inteligência está formulando um pitch matador...</p>
                            </div>
                        ) : pitchText ? (
                            <>
                                <div className="p-4 flex-1 text-sm text-gray-700 leading-relaxed overflow-y-auto w-full max-w-none break-words max-h-[300px]">
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
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400 min-h-[150px]">
                                <Target size={32} className="text-gray-200 mb-3" />
                                <p className="text-xs font-medium">Selecione uma oportunidade na lista ao lado para gerar o script de prospecção ideal.</p>
                            </div>
                        )}
                    </div>

                    {/* NOVOS ALVOS ENCONTRADOS */}
                    {selectedOp && (
                        <div className="mt-8 transition-all animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                    <Users size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alvos no Google Maps</p>
                                    <p className="text-xs font-black text-gray-900">Empresas para Prospectar</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {isLoadingTargets ? (
                                    <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <Loader2 className="animate-spin text-orange-400" size={20} />
                                    </div>
                                ) : targets && targets.length > 0 ? (
                                    targets.map(target => (
                                        <div key={target.place_id} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-[#25D366]/30 transition-all group">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h4 className="text-[11px] font-black text-gray-900 uppercase leading-tight">{target.name}</h4>
                                                {target.rating > 0 && (
                                                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md">
                                                        ★ {target.rating}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-400 mb-3 -mt-1 flex items-start gap-1">
                                                <MapPin size={10} className="shrink-0 mt-0.5" />
                                                <span className="truncate">{target.address}</span>
                                            </p>
                                            <button
                                                onClick={() => handleCallTarget(target)}
                                                className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border
                                                    ${target.status === 'prospectado'
                                                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-100'
                                                        : 'bg-[#C00000] text-white border-red-700 hover:bg-red-700 hover:shadow-md'}
                                                `}
                                            >
                                                {target.status === 'prospectado' ? (
                                                    <>
                                                        <Check size={14} />
                                                        Prospectado
                                                    </>
                                                ) : (
                                                    <>
                                                        <MessageCircle size={14} />
                                                        Abrir WhatsApp
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <p className="text-[10px] font-bold text-gray-400">Nenhum alvo novo encontrado nesta região.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
