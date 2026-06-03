import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCampanhaWizard } from "@/pages/campanhas/CampanhaWizard/useCampanhaWizard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select, { components } from "react-select";
import api from "@/services/api";
import {
    LayoutDashboard,
    Search,
    MapPin,
    MessageSquare,
    Upload,
    Calendar,
    X,
    ChevronRight,
    User,
    Building2,
    Monitor,
    Smartphone,
    Info,
    Eye,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ExpressCalendar } from "@/components/ui/ExpressCalendar";
import { ImageCropper } from "@/components/ui/ImageCropper";

const AD_TYPES = [
    {
        id: "banner_home",
        label: "Banner Home",
        description: "Exibição no topo da página inicial",
        icon: LayoutDashboard,
        placement: "HOME_TOP",
        tipo: "banner",
    },
    {
        id: "banner_listagem",
        label: "Banner Listagem",
        description: "Exibição lateral em listagens de segmentos",
        icon: Search,
        placement: "SEGMENT_LISTING",
        tipo: "banner",
    },
    {
        id: "banner_busca",
        label: "Banner Busca / Cidades",
        description: "Exibição por palavras-chave ou filtro de cidades",
        icon: MapPin,
        placement: "SEARCH_RESULT",
        tipo: "banner",
    },
    {
        id: "popup",
        label: "Pop up",
        description: "Janela sobreposta em toda a plataforma",
        icon: MessageSquare,
        placement: "POPUP_GLOBAL",
        tipo: "popup",
    },
];

export default function CampanhaWizard({
    mode = "create",
    campanhaId,
}: {
    mode?: "create" | "edit";
    campanhaId?: number;
}) {
    const navigate = useNavigate();
    const w = useCampanhaWizard({ mode, campanhaId });

    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const isPopup = selectedType === "popup";
    const stepCount = isPopup ? 4 : 5;

    // Se estiver em modo edit, pular para um passo que mostre tudo ou usar um layout unificado
    // Vou criar um layout de "Edição Rápida" que condensa os passos.

    // ─── Crop State ──────────────────────────────────────────────────────────
    const [cropping, setCropping] = useState<{
        slot: "desktop" | "mobile";
        image: string | null;
        aspect: number;
    } | null>(null);

    // Hidrata o tipo selecionado ao editar
    useEffect(() => {
        if (mode === "edit" && w.form?.placements?.length > 0) {
            const p = w.form.placements[0];
            const matched = AD_TYPES.find((t) => t.placement === p);
            if (matched) setSelectedType(matched.id);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, w.form?.placements]);

    // Validação de ID para modo edição
    if (mode === "edit" && !campanhaId) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="p-4 bg-red-50 rounded-full text-red-600">
                    <AlertTriangle size={32} />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-900">ID Inválido</h3>
                    <p className="text-gray-500">O identificador da campanha não foi encontrado na URL.</p>
                </div>
                <Button onClick={() => navigate("/campanhas")}>Voltar para Lista</Button>
            </div>
        );
    }

    // Guard: aguarda carregar dados no modo edit
    if (mode === "edit") {
        if (w.detalhe.isLoading) {
            return (
                <div className="flex flex-col items-center justify-center p-20 gap-4 animate-pulse">
                    <div className="h-10 w-10 border-4 border-red-700/20 border-t-red-700 rounded-full animate-spin" />
                    <p className="text-gray-500 font-medium tracking-tight">Recuperando dados da campanha #{campanhaId}...</p>
                </div>
            );
        }

        if (w.detalhe.isError) {
            return (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <div className="p-4 bg-red-50 rounded-full text-red-600">
                        <X size={32} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-gray-900">Erro ao Carregar</h3>
                        <p className="text-gray-500 max-w-sm">
                            Não conseguimos recuperar os dados desta campanha. Pode ser um erro de rede ou o registro não existe mais.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => w.detalhe.refetch()}>Tentar Novamente</Button>
                        <Button onClick={() => navigate("/campanhas")}>Ver Campanhas</Button>
                    </div>
                </div>
            );
        }
    }

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleSelectType = (typeId: string) => {
        const type = AD_TYPES.find((t) => t.id === typeId);
        if (type) {
            setSelectedType(typeId);
            w.onPatch({
                tipo: type.tipo as any,
                placements: [type.placement as any],
            });
            setStep(2);
        }
    };

    const nextStep = () => {
        if (step === 2) {
            if (!w.form.nome?.trim()) {
                toast.error("Preencha o Nome da campanha.");
                return;
            }
            if (!w.form.is_institucional) {
                if (!w.form.cliente_id || !w.form.data_inicio || !w.form.data_fim) {
                    toast.error("Preencha Cliente e Período.");
                    return;
                }
            }
        }
        setStep((prev) => prev + 1);
        window.scrollTo(0, 0);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await w.onSubmit();
            if (result?.id) {
                if (mode === "edit") {
                    navigate(`/campanhas/${result.id}`);
                } else {
                    navigate("/campanhas");
                }
            }
        } catch (e: any) {
            console.error("Erro ao salvar:", e);
        } finally {
            setSaving(false);
        }
    };

    const formatDateBR = (dateStr: string) => {
        if (!dateStr) return "—";
        return dayjs(dateStr).format("DD/MM/YYYY");
    };

    // ─── Custom Select Components ──────────────────────────────────────────
    const CustomOption = (props: any) => (
        <components.Option {...props}>
            <div className="flex items-center gap-3 py-1">
                <div className="p-2 bg-gray-50 text-gray-400 rounded-lg group-hover:bg-red-50 group-hover:text-[#B70F0A] transition-colors">
                    <Building2 size={16} />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 leading-tight">
                        {props.data.label}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase font-black">
                        ID: {props.data.value}
                    </span>
                </div>
            </div>
        </components.Option>
    );

    const CustomSingleValue = (props: any) => (
        <components.SingleValue {...props}>
            <div className="flex items-center gap-2">
                <Building2 size={16} className="text-[#B70F0A]" />
                <span className="text-sm font-bold text-gray-900">{props.data.label}</span>
            </div>
        </components.SingleValue>
    );

    const PLACEMENT_SPECS: Record<string, { label: string; desktop: string; mobile: string; desc: string }> = {
        HOME_TOP: {
            label: "Banner Topo (Home)",
            desktop: "1280x480px",
            mobile: "600x600px",
            desc: "Exibido no topo da página inicial do portal."
        },
        POPUP_GLOBAL: {
            label: "Popup Global",
            desktop: "800x800px",
            mobile: "600x800px",
            desc: "Janela flutuante que aparece ao entrar no site."
        },
        SEARCH_RESULT: {
            label: "Banner de Busca",
            desktop: "1280x400px",
            mobile: "600x600px",
            desc: "Exibido no topo dos resultados de pesquisa."
        },
        SEGMENT_LISTING: {
            label: "Banner de Segmento",
            desktop: "1280x400px",
            mobile: "600x600px",
            desc: "Exibido na listagem de categorias."
        }
    };

    // ─── Steps ────────────────────────────────────────────────────────────────

    const renderStep1 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Qual o tipo de publicidade?</h2>
                <p className="text-gray-500 text-sm">Selecione uma opção para continuar.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto pt-4">
                {AD_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => handleSelectType(type.id)}
                            className={cn(
                                "group relative flex items-start p-6 rounded-3xl border-2 text-left transition-all duration-300 hover:shadow-md",
                                selectedType === type.id
                                    ? "bg-white border-[#B70F0A] ring-4 ring-red-50"
                                    : "bg-white border-gray-100 hover:border-gray-300"
                            )}
                        >
                            <div
                                className={cn(
                                    "p-4 rounded-2xl shrink-0",
                                    selectedType === type.id
                                        ? "bg-red-50 text-[#B70F0A]"
                                        : "bg-gray-50 text-gray-400"
                                )}
                            >
                                <Icon size={24} />
                            </div>
                            <div className="ml-5 flex-1">
                                <h3 className="font-bold text-gray-900 mb-1">{type.label}</h3>
                                <p className="text-xs text-gray-500">{type.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl mx-auto text-left">
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Título</label>
                    <Input
                        value={w.form.nome || ""}
                        onChange={(e) => w.onPatch({ nome: e.target.value })}
                        placeholder="Ex: Banner Natal 2025"
                        className="h-12 rounded-2xl"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Cliente</label>
                    <Select
                        placeholder="Pesquisar cliente..."
                        isLoading={w.loadingClientes}
                        onInputChange={(val) => w.setClienteSearch(val)}
                        components={{
                            Option: CustomOption,
                            SingleValue: CustomSingleValue,
                            IndicatorSeparator: () => null,
                        }}
                        options={(w.filteredClientes || []).map((c: any) => ({
                            value: String(c.id),
                            label: c.nome_fantasia || c.razao_social,
                        }))}
                        value={
                            w.form.cliente_id
                                ? { value: w.form.cliente_id, label: w.clienteLabel }
                                : null
                        }
                        onChange={(val: any) => w.onPatch({ cliente_id: val?.value || "" })}
                        styles={{
                            control: (base, state) => ({
                                ...base,
                                borderRadius: "20px",
                                minHeight: "64px",
                                paddingLeft: "12px",
                                borderColor: state.isFocused ? "#B70F0A" : "#F3F4F6",
                                boxShadow: state.isFocused ? "0 0 0 4px rgba(183, 15, 10, 0.1)" : "none",
                                "&:hover": { borderColor: "#E5E7EB" },
                                transition: "all 0.3s ease",
                                backgroundColor: "#FFF",
                            }),
                            placeholder: (base) => ({ ...base, color: "#9CA3AF", fontSize: "14px", fontWeight: "600" }),
                            menu: (base) => ({
                                ...base,
                                borderRadius: "24px",
                                padding: "8px",
                                border: "1px solid #F3F4F6",
                                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                                overflow: "hidden",
                                animation: "in 0.2s zoom-in-95",
                            }),
                            option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isFocused ? "#FEF2F2" : "transparent",
                                color: state.isFocused ? "#B70F0A" : "#111827",
                                borderRadius: "16px",
                                cursor: "pointer",
                                "&:active": { backgroundColor: "#FEE2E2" },
                            }),
                        }}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Período de Veiculação</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    "w-full flex items-center gap-4 h-16 px-6 rounded-[20px] border-2 transition-all text-left",
                                    w.form.data_inicio ? "border-gray-100 bg-white" : "border-dashed border-gray-200 bg-gray-50/50"
                                )}
                            >
                                <div className="p-3 bg-red-50 text-[#B70F0A] rounded-xl">
                                    <Calendar size={20} />
                                </div>
                                <div className="flex-1">
                                    {w.form.data_inicio ? (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Duração da Campanha</span>
                                            <span className="text-sm font-bold text-gray-900">
                                                {formatDateBR(w.form.data_inicio)} — {formatDateBR(w.form.data_fim)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-sm font-bold text-gray-400 italic">Clique para selecionar as datas</span>
                                    )}
                                </div>
                                <ChevronRight size={18} className="text-gray-300" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start">
                            <ExpressCalendar 
                                startDate={w.form.data_inicio}
                                endDate={w.form.data_fim}
                                onChange={(start, end) => w.onPatch({ data_inicio: start || "", data_fim: end || "" })}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">URL de Destino <span className="font-normal">(opcional)</span></label>
                    <Input
                        value={w.form.url || ""}
                        onChange={(e) => w.onPatch({ url: e.target.value })}
                        placeholder="Ex: https://suaempresa.com.br/promocao"
                        className="h-12 rounded-2xl"
                    />
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/30">
                    <div className="space-y-0.5">
                        <label className="text-sm font-bold text-gray-900">Campanha Institucional</label>
                        <p className="text-xs text-gray-500">Se não tiver outras campanhas, esta é a padrão</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => w.onPatch({ is_institucional: !w.form.is_institucional })}
                        className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                            w.form.is_institucional ? "bg-[#B70F0A]" : "bg-gray-200"
                        )}
                    >
                        <span
                            className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                w.form.is_institucional ? "translate-x-6" : "translate-x-1"
                            )}
                        />
                    </button>
                </div>
            </div>
            <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-14 rounded-2xl">
                    Voltar
                </Button>
                <Button onClick={nextStep} className="flex-[2] h-14 rounded-2xl bg-[#B70F0A] text-white">
                    Próximo
                </Button>
            </div>
        </div>
    );

    const renderStep3Targeting = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl mx-auto">
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                <div className="space-y-2 text-left">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Cidades <span className="font-normal text-gray-400">(opcional)</span>
                    </label>
                    <Select
                        isMulti
                        placeholder="Selecione cidades..."
                        isLoading={w.loadingCidades}
                        options={(w.cidades || []).map((c: any) => ({
                            value: c.id,
                            label: `${c.nome} - ${c.uf}`,
                        }))}
                        value={(w.cidades || [])
                            .filter((c: any) => (w.form.cidades_ids || []).includes(c.id))
                            .map((c: any) => ({ value: c.id, label: `${c.nome} - ${c.uf}` }))}
                        onChange={(vals: any) =>
                            w.onPatch({ cidades_ids: (vals || []).map((v: any) => v.value) })
                        }
                    />
                </div>
                <div className="space-y-4 text-left">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Keywords <span className="font-normal text-gray-400">(digite e pressione ENTER)</span>
                    </label>
                    <div className="min-h-[120px] w-full rounded-2xl border border-gray-200 bg-gray-50/30 p-4 focus-within:border-[#B70F0A] transition-colors">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {(w.keywordsParsed || []).map((kw, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-[#B70F0A] text-xs font-bold rounded-full border border-red-100">
                                    {kw}
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const next = (w.keywordsParsed || []).filter(k => k !== kw);
                                            w.onPatch({ keywords_text: next.join(", ") });
                                        }}
                                        className="hover:text-red-800 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Adicionar palavra-chave..."
                            className="w-full bg-transparent outline-none text-sm text-gray-700 mt-1"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    const max = w.form.plano === 'premium' ? 20 : w.form.plano === 'profissional' ? 10 : 5;
                                    if (w.keywordsParsed.length >= max) {
                                        toast.error(`Limite de ${max} palavras-chave atingido para o plano ${w.form.plano}.`);
                                        return;
                                    }
                                    const val = e.currentTarget.value.trim();
                                    if (!val) return;
                                    const current = w.form.keywords_text || "";
                                    const next = current ? `${current}, ${val}` : val;
                                    w.onPatch({ keywords_text: next });
                                    e.currentTarget.value = "";
                                }
                            }}
                        />
                    </div>

                    {/* ✅ Sugestões Inteligentes */}
                    {w.keywordSuggestions.length > 0 && (
                        <div className="space-y-3 mt-6 animate-in fade-in slide-in-from-top-2 duration-700">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sugestões baseadas no perfil</span>
                                {w.loadingSuggestions && (
                                    <div className="w-3 h-3 border-2 border-[#B70F0A] border-t-transparent rounded-full animate-spin" />
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {w.keywordSuggestions
                                    .filter(s => !w.keywordsParsed.includes(s))
                                    .slice(0, 15)
                                    .map((s, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                            const current = w.form.keywords_text || "";
                                            const next = current ? `${current}, ${s}` : s;
                                            w.onPatch({ keywords_text: next });
                                        }}
                                        className="px-3 py-1.5 bg-white hover:bg-red-50 hover:text-[#B70F0A] hover:border-red-200 text-gray-600 text-xs font-medium rounded-xl border border-gray-100 shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                                    >
                                        <span className="text-red-400 text-base leading-none">+</span>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(2)} className="flex-1 h-14 rounded-2xl">
                    Voltar
                </Button>
                <Button
                    onClick={() => { setStep(4); window.scrollTo(0, 0); }}
                    className="flex-[2] h-14 rounded-2xl bg-[#B70F0A] text-white"
                >
                    Próximo
                </Button>
            </div>
        </div>
    );

    const parseDimension = (dim: string) => {
        const parts = dim.replace("px", "").split("x").map(Number);
        return { w: parts[0] || 1280, h: parts[1] || 400 };
    };

    const renderStepMedia = () => {
        const primaryPlacement = w.form.placements[0] || "HOME_TOP";
        const specs = PLACEMENT_SPECS[primaryPlacement] || PLACEMENT_SPECS.HOME_TOP;

        return (
            <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-gray-900 font-serif tracking-tight italic">Mídias Criativas</h2>
                    <p className="text-sm text-gray-500 font-medium">Anexe as artes da campanha para Desktop e Mobile.</p>
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 mt-4">
                        <Info size={16} />
                        <span className="text-xs font-bold uppercase tracking-tight">Dimensões Recomendadas</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {(["desktop", "mobile"] as const).map((device) => {
                        const previewUrl =
                            device === "desktop"
                                ? w.form.midia_desktop_public_url
                                : w.form.midia_mobile_public_url;
                        const dimension = device === "desktop" ? specs.desktop : specs.mobile;

                        return (
                            <div key={device} className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        {device === "desktop" ? <Monitor size={16} /> : <Smartphone size={16} />}
                                        <span className="text-xs font-black uppercase tracking-widest text-gray-900">{device}</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                                        {dimension}
                                    </span>
                                </div>
                                <Card
                                    className={cn(
                                        "p-6 relative rounded-[32px] border-dashed border-2 flex flex-col items-center justify-center min-h-[220px] transition-all overflow-hidden",
                                        previewUrl ? "border-transparent bg-gray-50" : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/10"
                                    )}
                                >
                                    {!previewUrl && (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                                                <Upload size={24} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-black text-gray-900 uppercase">Enviar Arquivo</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG ou GIF</p>
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            // 1) Ler arquivo para base64 para o cropper
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                const dim = parseDimension(dimension);
                                                setCropping({
                                                    slot: device,
                                                    image: event.target?.result as string,
                                                    aspect: dim.w / dim.h,
                                                });
                                            };
                                            reader.readAsDataURL(file);
                                            e.target.value = ""; // Clear input
                                        }}
                                    />
                                    {previewUrl && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white p-2">
                                            <img
                                                src={previewUrl}
                                                alt={`Preview ${device}`}
                                                className="max-w-full max-h-full object-contain rounded-2xl shadow-sm"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    w.setTempMedia(device, "", "", "");
                                                }}
                                                className="absolute top-4 right-4 z-20 bg-gray-900/80 backdrop-blur-md text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        );
                    })}
                </div>

                {/* --- PREVIEW MOCKUP --- */}
                {(w.form.midia_desktop_public_url || w.form.midia_mobile_public_url) && (
                    <div className="pt-10 space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div className="p-2 bg-red-50 text-[#B70F0A] rounded-xl font-bold">
                                <Eye size={20} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 font-serif italic tracking-tight">Prévia no Portal</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Desktop Mockup */}
                            {w.form.midia_desktop_public_url && (
                                <div className="space-y-4">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Desktop View</span>
                                    <div className="relative bg-gray-100 rounded-2xl p-2 border-4 border-gray-200 shadow-2xl overflow-hidden aspect-video">
                                        <div className="bg-white h-full w-full rounded-lg overflow-hidden flex flex-col">
                                            <div className="h-6 bg-gray-50 border-b flex items-center gap-1 px-3">
                                                <div className="w-2 h-2 rounded-full bg-red-300" />
                                                <div className="w-2 h-2 rounded-full bg-yellow-300" />
                                                <div className="w-2 h-2 rounded-full bg-green-300" />
                                            </div>
                                            <div className="flex-1 overflow-y-auto bg-white p-2 space-y-4">
                                                <div className="w-full h-8 bg-gray-50 rounded-md" />
                                                <div className="relative w-full overflow-hidden rounded-xl border border-dashed border-red-200">
                                                    <img src={w.form.midia_desktop_public_url} className="w-full object-cover" />
                                                    <div className="absolute top-2 right-2 bg-red-600/80 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase">Ad</div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="h-20 bg-gray-50 rounded-md" />
                                                    <div className="h-20 bg-gray-50 rounded-md" />
                                                    <div className="h-20 bg-gray-50 rounded-md" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Mobile Mockup */}
                            {w.form.midia_mobile_public_url && (
                                <div className="space-y-4 flex flex-col items-center lg:items-start">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Mobile View</span>
                                    <div className="relative w-[180px] bg-gray-900 rounded-[35px] p-2.5 border-4 border-gray-800 shadow-2xl overflow-hidden aspect-[9/18]">
                                        <div className="bg-white h-full w-full rounded-[25px] overflow-hidden flex flex-col">
                                            <div className="h-4 bg-white flex items-center justify-center">
                                                <div className="w-10 h-1 bg-gray-900/10 rounded-full" />
                                            </div>
                                            <div className="flex-1 overflow-y-auto bg-white p-2 space-y-3">
                                                <div className="w-10 h-10 bg-red-50 rounded-full mx-auto" />
                                                <div className="w-full h-4 bg-gray-50 rounded-full" />
                                                <div className="relative w-full aspect-square overflow-hidden rounded-2xl border border-dashed border-red-200">
                                                    <img src={w.form.midia_mobile_public_url} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="h-10 bg-gray-50 rounded-xl" />
                                                <div className="h-10 bg-gray-50 rounded-xl" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex gap-4 pt-10">
                    <Button
                        variant="ghost"
                        onClick={() => setStep(isPopup ? 2 : 3)}
                        className="flex-1 h-14 rounded-2xl"
                    >
                        Voltar
                    </Button>
                    <Button
                        onClick={() => { setStep(isPopup ? 4 : 5); window.scrollTo(0, 0); }}
                        className="flex-[2] h-14 rounded-2xl bg-[#B70F0A] text-white"
                    >
                        Ver Resumo
                    </Button>
                </div>

                {/* --- MODAL DE CROP --- */}
                {cropping && (
                    <ImageCropper
                        image={cropping.image}
                        aspect={cropping.aspect}
                        title={`Recortar arte ${cropping.slot === "desktop" ? "Desktop" : "Mobile"}`}
                        onCancel={() => setCropping(null)}
                        onCropComplete={async (blob) => {
                            const slot = cropping.slot;
                            setCropping(null);
                            
                            const t = toast.loading("Processando e enviando...");
                            const fd = new FormData();
                            fd.append("files[]", blob, `crop_${slot}.jpg`);
                            
                            try {
                                const { data } = await api.post("/v1/upload-temp", fd);
                                if (data?.success && data.files?.length > 0) {
                                    const uploaded = data.files[0];
                                    w.setTempMedia(slot, uploaded.path, uploaded.public_url, `crop_${slot}.jpg`);
                                    toast.dismiss(t);
                                    toast.success("Imagem recortada e aplicada!");
                                }
                            } catch (err) {
                                toast.dismiss(t);
                                toast.error("Erro ao enviar imagem recortada.");
                            }
                        }}
                    />
                )}
            </div>
        );
    };

    const renderSummary = () => (
        <div className="space-y-8 max-w-2xl mx-auto text-left">
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl p-8 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        Resumo da Campanha
                    </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{w.form.nome || "—"}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">VIGÊNCIA</label>
                        <p className="text-gray-700">
                            {formatDateBR(w.form.data_inicio)} → {formatDateBR(w.form.data_fim)}
                        </p>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">ALCANCE</label>
                        <p className="text-gray-700">
                            {isPopup ? "Global" : w.form.cidades_ids?.length ? `${w.form.cidades_ids.length} cidade(s)` : "Todas as cidades"}
                        </p>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">TIPO</label>
                        <p className="text-gray-700 capitalize">{w.form.tipo || "—"}</p>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">CLIENTE</label>
                        <p className="text-gray-700">{w.clienteLabel || `#${w.form.cliente_id}` || "—"}</p>
                    </div>
                </div>
                {(w.form.midia_desktop_public_url || w.form.midia_mobile_public_url) && (
                    <div className="flex gap-2 flex-wrap">
                        {w.form.midia_desktop_public_url && (
                            <span className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium">
                                ✓ Desktop
                            </span>
                        )}
                        {w.form.midia_mobile_public_url && (
                            <span className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium">
                                ✓ Mobile
                            </span>
                        )}
                    </div>
                )}
            </div>
            <div className="flex gap-4">
                <Button
                    variant="ghost"
                    onClick={() => setStep(isPopup ? 3 : 4)}
                    className="flex-1 h-16 rounded-2xl"
                >
                    Ajustar
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-[2] h-16 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg disabled:opacity-60"
                >
                    {saving ? "Salvando..." : "✓ Finalizar e Gerar"}
                </Button>
            </div>
        </div>
    );

    const renderEditForm = () => {
        const primaryPlacement = w.form.placements[0] || "HOME_TOP";
        const specs = PLACEMENT_SPECS[primaryPlacement] || PLACEMENT_SPECS.HOME_TOP;

        return (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Coluna Esquerda: Dados e Segmentação */}
                    <div className="space-y-6">
                        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-4">Dados Básicos</h3>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Título da Campanha</label>
                                <Input
                                    value={w.form.nome || ""}
                                    onChange={(e) => w.onPatch({ nome: e.target.value })}
                                    className="h-12 rounded-2xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Cliente</label>
                                <Select
                                    placeholder="Pesquisar cliente..."
                                    isLoading={w.loadingClientes}
                                    onInputChange={(val) => w.setClienteSearch(val)}
                                    components={{
                                        Option: CustomOption,
                                        SingleValue: CustomSingleValue,
                                        IndicatorSeparator: () => null,
                                    }}
                                    options={(w.filteredClientes || []).map((c: any) => ({
                                        value: String(c.id),
                                        label: c.nome_fantasia || c.razao_social,
                                    }))}
                                    value={
                                        w.form.cliente_id
                                            ? { value: w.form.cliente_id, label: w.clienteLabel }
                                            : null
                                    }
                                    onChange={(val: any) => w.onPatch({ cliente_id: val?.value || "" })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Período de Veiculação</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="w-full flex items-center gap-4 h-14 px-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-red-100 transition-all text-left">
                                            <Calendar size={18} className="text-[#B70F0A]" />
                                            <span className="text-sm font-bold text-gray-900 flex-1">
                                                {w.form.data_inicio ? `${formatDateBR(w.form.data_inicio)} — ${formatDateBR(w.form.data_fim)}` : "Selecionar datas"}
                                            </span>
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start">
                                        <ExpressCalendar 
                                            startDate={w.form.data_inicio}
                                            endDate={w.form.data_fim}
                                            onChange={(start, end) => w.onPatch({ data_inicio: start || "", data_fim: end || "" })}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">URL de Destino (opcional)</label>
                                <Input
                                    value={w.form.url || ""}
                                    onChange={(e) => w.onPatch({ url: e.target.value })}
                                    placeholder="Ex: https://suaempresa.com.br/promo"
                                    className="h-12 rounded-2xl"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/30">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-bold text-gray-900">Campanha Institucional</label>
                                    <p className="text-xs text-gray-500">Exibir como fallback quando não houver campanhas específicas</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => w.onPatch({ is_institucional: !w.form.is_institucional })}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                        w.form.is_institucional ? "bg-[#B70F0A]" : "bg-gray-200"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                            w.form.is_institucional ? "translate-x-6" : "translate-x-1"
                                        )}
                                    />
                                </button>
                            </div>
                        </section>

                        {!isPopup && (
                            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6 text-left">
                                <h3 className="text-lg font-bold text-gray-900 border-b pb-4">Segmentação</h3>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Cidades</label>
                                    <Select
                                        isMulti
                                        placeholder="Selecione cidades..."
                                        isLoading={w.loadingCidades}
                                        options={(w.cidades || []).map((c: any) => ({ value: c.id, label: `${c.nome} - ${c.uf}` }))}
                                        value={(w.cidades || [])
                                            .filter((c: any) => (w.form.cidades_ids || []).includes(c.id))
                                            .map((c: any) => ({ value: c.id, label: `${c.nome} - ${c.uf}` }))}
                                        onChange={(vals: any) => w.onPatch({ cidades_ids: (vals || []).map((v: any) => v.value) })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                        Keywords <span className="font-normal text-gray-400">(digite e pressione ENTER)</span>
                                    </label>
                                    <div className="min-h-[100px] w-full rounded-2xl border border-gray-100 bg-gray-50/30 p-4 focus-within:border-red-100 transition-colors">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(w.keywordsParsed || []).map((kw, i) => (
                                                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-[#B70F0A] text-[10px] font-black uppercase rounded-full border border-red-100">
                                                    {kw}
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            const next = (w.keywordsParsed || []).filter(k => k !== kw);
                                                            w.onPatch({ keywords_text: next.join(", ") });
                                                        }}
                                                        className="hover:text-red-800 transition-colors"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Adicionar..."
                                            className="w-full bg-transparent outline-none text-sm text-gray-700 font-medium"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    const val = e.currentTarget.value.trim();
                                                    if (!val) return;
                                                    const current = w.form.keywords_text || "";
                                                    const next = current ? `${current}, ${val}` : val;
                                                    w.onPatch({ keywords_text: next });
                                                    e.currentTarget.value = "";
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* ✅ Sugestões Inteligentes */}
                                    {w.keywordSuggestions.length > 0 && (
                                        <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2 duration-700">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Sugestões</span>
                                                {w.loadingSuggestions && (
                                                    <div className="w-2.5 h-2.5 border-2 border-[#B70F0A] border-t-transparent rounded-full animate-spin" />
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {w.keywordSuggestions
                                                    .filter(s => !w.keywordsParsed.includes(s))
                                                    .slice(0, 10)
                                                    .map((s, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => {
                                                            const current = w.form.keywords_text || "";
                                                            const next = current ? `${current}, ${s}` : s;
                                                            w.onPatch({ keywords_text: next });
                                                        }}
                                                        className="px-2.5 py-1 bg-white hover:bg-red-50 hover:text-[#B70F0A] hover:border-red-100 text-gray-500 text-[11px] font-bold rounded-lg border border-gray-100 shadow-sm transition-all active:scale-95 flex items-center gap-1"
                                                    >
                                                        <span className="text-red-400 text-sm leading-none">+</span>
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Coluna Direita: Mídias */}
                    <div className="space-y-6">
                        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6 text-left">
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-4">Mídias</h3>
                            <div className="grid grid-cols-1 gap-6">
                                {(["desktop", "mobile"] as const).map((device) => {
                                    const previewUrl = device === "desktop" ? w.form.midia_desktop_public_url : w.form.midia_mobile_public_url;
                                    const dimension = device === "desktop" ? specs.desktop : specs.mobile;
                                    return (
                                        <div key={device} className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[10px] font-black uppercase text-gray-400">{device} - {dimension}</span>
                                            </div>
                                            <div className="relative aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden group">
                                                {previewUrl ? (
                                                    <div className="w-full h-full p-2">
                                                        <img src={previewUrl} className="w-full h-full object-contain rounded-xl" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                             <button 
                                                                onClick={() => w.setTempMedia(device, "", "", "")}
                                                                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                                                        <Upload size={24} />
                                                        <span className="text-[10px] font-bold uppercase">Clique para subir</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                const reader = new FileReader();
                                                                reader.onload = (event) => {
                                                                    const dim = parseDimension(dimension);
                                                                    setCropping({ slot: device, image: event.target?.result as string, aspect: dim.w / dim.h });
                                                                };
                                                                reader.readAsDataURL(file);
                                                                e.target.value = "";
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                        
                        <div className="pt-4 flex gap-4">
                            <Button
                                variant="outline"
                                onClick={() => navigate(-1)}
                                className="flex-1 h-14 rounded-2xl border-gray-200 text-gray-500 hover:bg-gray-50"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-[2] h-14 rounded-2xl bg-[#B70F0A] text-white hover:bg-[#8B0B08] shadow-lg shadow-red-900/10"
                            >
                                {saving ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Modal de Crop */}
                {cropping && (
                    <ImageCropper
                        image={cropping.image}
                        aspect={cropping.aspect}
                        title={`Recortar arte ${cropping.slot}`}
                        onCancel={() => setCropping(null)}
                        onCropComplete={async (blob) => {
                            const slot = cropping.slot;
                            setCropping(null);
                            const t = toast.loading("Processando...");
                            const fd = new FormData();
                            fd.append("files[]", blob, `crop_${slot}.jpg`);
                            try {
                                const { data } = await api.post("/v1/upload-temp", fd);
                                if (data?.success && data.files?.length > 0) {
                                    const uploaded = data.files[0];
                                    w.setTempMedia(slot, uploaded.path, uploaded.public_url, `crop_${slot}.jpg`);
                                    toast.dismiss(t);
                                    toast.success("Imagem atualizada!");
                                }
                            } catch { toast.dismiss(t); toast.error("Erro no upload."); }
                        }}
                    />
                )}
            </div>
        );
    };

    // ─── Layout ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[#F8F9FC] font-sans">
            <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                             <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter",
                                mode === "edit" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                            )}>
                                {mode === "edit" ? "Modo Edição Rápida" : "Lançar Publicidade"}
                            </span>
                             {mode === "edit" && <span className="text-xs font-medium text-gray-400">ID: #{campanhaId}</span>}
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tighter font-serif italic">
                            {mode === "edit" ? "Editar Campanha" : "Nova Campanha"}
                        </h1>
                        <p className="text-gray-400 font-medium">Fluxo Express</p>
                    </div>
                    {mode === "create" && (
                        <div className="text-right">
                             <span className="text-sm text-gray-400">
                                Passo <strong className="text-gray-700">{step}</strong> de{" "}
                                <strong className="text-gray-700">{stepCount}</strong>
                            </span>
                        </div>
                    )}
                </header>

                {mode === "create" && (
                    <div className="flex gap-2 max-w-sm mx-auto">
                        {Array.from({ length: stepCount }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-2 flex-1 rounded-full transition-all duration-300",
                                    i + 1 <= step ? "bg-[#B70F0A]" : "bg-gray-200"
                                )}
                            />
                        ))}
                    </div>
                )}

                <main className="pb-20">
                    {mode === "edit" ? renderEditForm() : (
                        <>
                            {step === 1 && renderStep1()}
                            {step === 2 && renderStep2()}
                            {step === 3 && (isPopup ? renderStepMedia() : renderStep3Targeting())}
                            {step === 4 && (isPopup ? renderSummary() : renderStepMedia())}
                            {step === 5 && !isPopup && renderSummary()}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
