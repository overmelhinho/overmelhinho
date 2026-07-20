import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "@/services/api";
import { 
    ArrowLeft, Send, Globe, Loader2, Calendar, Edit3, Save, MessageCircle, MapPin, TrendingUp, Search, Eye, Users, Clock, Zap, BarChart2, Check, Plus, Trash2, History, Copy, ExternalLink, Star 
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExpressCalendar } from "@/components/ui/ExpressCalendar";

// ── Componentes de UI ─────────────────────────────────────────────────────────

function EditableNumber({ label, value, onChange, color = "text-gray-900" }: {
    label: string; value: number | string; onChange: (val: number) => void; color?: string;
}) {
    const [editing, setEditing] = useState(false);
    const [temp, setTemp] = useState(value.toString());

    if (editing) {
        return (
            <div className="flex flex-col gap-1 ring-2 ring-blue-500 rounded-lg p-1">
                <p className="text-[10px] font-black uppercase text-blue-500 px-1">{label}</p>
                <input
                    autoFocus
                    type="number"
                    className="w-full bg-transparent border-none focus:ring-0 text-xl font-black p-1"
                    value={temp}
                    onChange={e => setTemp(e.target.value)}
                    onBlur={() => {
                        onChange(parseInt(temp) || 0);
                        setEditing(false);
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            onChange(parseInt(temp) || 0);
                            setEditing(false);
                        }
                    }}
                />
            </div>
        );
    }

    return (
        <div 
            onClick={() => { setTemp(value.toString()); setEditing(true); }}
            className="cursor-pointer group hover:bg-gray-50 p-2 rounded-xl transition-all"
        >
            <p className="text-[10px] font-black uppercase text-gray-400 group-hover:text-blue-500 flex items-center gap-1">
                {label} <Edit3 size={8} className="opacity-0 group-hover:opacity-100" />
            </p>
            <p className={`text-2xl font-black transition-colors ${color}`}>
                {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </p>
        </div>
    );
}

// ── Pagina Principal ──────────────────────────────────────────────────────────

export default function ClientReportPreviewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [period, setPeriod] = useState("30d");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [overrides, setOverrides] = useState<Record<string, any>>({});
    const [cities, setCities] = useState<any[]>([]);
    const [notes, setNotes] = useState("");
    const [saved, setSaved] = useState<{ id: number; token: string; link: string } | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    const fetchHistory = async () => {
        setIsHistoryOpen(true);
        try {
            const res = await axios.get(`/v1/clients/${id}/reports`);
            setHistory(res.data);
        } catch (e) {
            console.error("Erro ao carregar histórico", e);
        }
    };

    const { data, isLoading, isFetching, error } = useQuery({
        queryKey: ["report-preview", id, period, customStart, customEnd],
        queryFn: async () => {
            let url = `/v1/clients/${id}/reports/preview?period=${period}`;
            if (period === "custom" && customStart && customEnd) {
                url += `&start_date=${customStart}&end_date=${customEnd}`;
            }
            const res = await axios.get(url);
            return res.data;
        },
        enabled: !!id,
    });

    // Sincronização de Estado
    useEffect(() => {
        if (data?.ga4?.cities) {
            setCities(data.ga4.cities);
            setOverrides({}); 
        }
    }, [data]);


    const ga4Data  = data?.ga4 ?? {};
    const convData = data?.conversions ?? {};

    const get = (key: string, defaultValue: any) => overrides[key] ?? defaultValue;

    // ── Distribuição Proporcional ──────────────────────────────────────────

    const redistributeField = (field: "views" | "users" | "events", newTotal: number) => {
        if (cities.length === 0) return;
        
        const currentTotal = cities.reduce((sum, c) => sum + (parseInt(c[field]) || 0), 0);
        if (currentTotal === 0) {
            // Se tudo é zero, distribui igual
            const perCity = Math.floor(newTotal / cities.length);
            const newCities = cities.map(c => ({ ...c, [field]: perCity }));
            setCities(newCities);
        } else {
            const factor = newTotal / currentTotal;
            let runningSum = 0;
            const newCities = cities.map((c, idx) => {
                const val = Math.round((parseInt(c[field]) || 0) * factor);
                runningSum += val;
                // Ajuste na última linha para fechar o total exato
                if (idx === cities.length - 1) {
                    const diff = newTotal - runningSum + val;
                    return { ...c, [field]: Math.max(0, diff) };
                }
                return { ...c, [field]: val };
            });
            setCities(newCities);
        }
    };

    // ── Handlers de Tabela ────────────────────────────────────────────────

    const updateCity = (index: number, field: string, value: any) => {
        const newCities = [...cities];
        newCities[index] = { ...newCities[index], [field]: value };
        setCities(newCities);
    };

    const removeCity = (index: number) => {
        setCities(cities.filter((_, i) => i !== index));
    };

    const addCity = () => {
        setCities([...cities, { title: "Nova Cidade", views: 0, users: 0, avg_time: 0, events: 0 }]);
    };

    // ── Totais Dinâmicos ──────────────────────────────────────────────────

    const calculatedTotals = useMemo(() => {
        return cities.reduce((acc, c) => ({
            views: acc.views + (parseInt(c.views) || 0),
            users: acc.users + (parseInt(c.users) || 0),
            events: acc.events + (parseInt(c.events) || 0),
            totalTime: acc.totalTime + (parseInt(c.avg_time) * (parseInt(c.users) || 0))
        }), { views: 0, users: 0, events: 0, totalTime: 0 });
    }, [cities]);

    // Card Values (Sempre refletem a tabela se não houver override direto)
    const rawGa4Views = ga4Data.total_views > 0 ? ga4Data.total_views : (calculatedTotals.views || 0);
    
    // As 6 Métricas Solicitadas
    const viewsGeral    = get('views_geral',    rawGa4Views + (convData.db_views || 0));
    const viewsSegmento = get('views_segmento', Math.max(0, rawGa4Views - (calculatedTotals.views || 0)));
    const viewsCidade   = get('views_cidade',   calculatedTotals.views || 0);
    const viewsDireto   = get('views_direto',   (convData.db_views || 0) + (data?.portal_searches || 0));
    const clicksWaze    = get('clicks_waze',    convData.waze || 0);
    const clicksWhats   = get('clicks_whats',   convData.whatsapp || 0);

    // Variáveis antigas para a tabela
    const totalViews  = viewsGeral;
    const totalUsers  = get('ga4_users',  ga4Data.total_users > 0 ? ga4Data.total_users : (calculatedTotals.users || 0));
    const totalEvents = get('ga4_events', ga4Data.total_events > 0 ? ga4Data.total_events : (calculatedTotals.events || 0));
    const avgTime     = get('ga4_time',   ga4Data.avg_time || (totalUsers > 0 ? Math.round(calculatedTotals.totalTime / totalUsers) : 0));

    // ── Mutação ──────────────────────────────────────────────────────────

    const { mutate: saveReport, isPending: saving } = useMutation({
        mutationFn: async () => {
            const finalizedData = {
                ga4: {
                    total_views: totalViews,
                    total_users: totalUsers,
                    avg_time: avgTime,
                    total_events: totalEvents,
                    cities: cities.map(c => ({
                        ...c,
                        pct_views: totalViews > 0 ? Math.round((c.views / totalViews) * 1000) / 10 : 0,
                        pct_users: totalUsers > 0 ? Math.round((c.users / totalUsers) * 1000) / 10 : 0,
                    }))
                },
                custom_metrics: {
                    views_geral: viewsGeral,
                    views_segmento: viewsSegmento,
                    views_cidade: viewsCidade,
                    views_direto: viewsDireto,
                    clicks_waze: clicksWaze,
                    clicks_whats: clicksWhats,
                },
                conversions: {
                    whatsapp: get('whatsapp', convData.whatsapp || 0),
                    waze:     get('waze',     convData.waze || 0),
                    social:   get('social',   convData.social || 0),
                    db_views: get('db_views', convData.db_views || 0),
                },
                portal_searches: get('searches', data?.portal_searches || 0),
            };

            const res = await axios.post(`/v1/clients/${id}/reports`, {
                period_label: data.period_label,
                data: finalizedData,
                notes,
            });
            return res.data;
        },
        onSuccess: (res) => setSaved(res),
    });

    if (error) {
        return (
            <div className="p-20 text-center font-sans">
                <p className="text-red-500 font-black uppercase mb-4 tracking-widest text-xs">Erro ao carregar dados</p>
                <button onClick={() => window.location.reload()} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-colors">Tentar novamente</button>
            </div>
        );
    }

    if (isLoading) return <div className="p-20 text-center font-black animate-pulse uppercase tracking-[0.2em] text-gray-400">Preparando relatório...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Report Builder</p>
                        <h1 className="text-sm font-black text-gray-900">{data?.cliente?.nome_fantasia}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchHistory} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-widest px-4 h-9 rounded-xl transition-all mr-2">
                        <History size={14} /> Histórico
                    </button>
                    {data?.cliente?.contract_starts_at && data?.cliente?.contract_ends_at && (
                        <button 
                            onClick={() => {
                                setPeriod("custom");
                                setCustomStart(data.cliente.contract_starts_at.split('T')[0]);
                                setCustomEnd(data.cliente.contract_ends_at.split('T')[0]);
                            }}
                            className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-[10px] font-black uppercase tracking-widest px-4 h-9 rounded-xl hover:bg-yellow-100 transition-all mr-2"
                            title="Usar período do contrato vigente"
                        >
                            <Star size={14} className="fill-yellow-500 text-yellow-500" /> Contrato Vigente
                        </button>
                    )}
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                        {["30d", "90d", "365d"].map(p => (
                            <button
                                key={p}
                                onClick={() => { setPeriod(p); setCustomStart(""); setCustomEnd(""); }}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-white text-[#C00000] shadow-sm ring-1 ring-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {p === '365d' ? '1 ano' : p}
                            </button>
                        ))}
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 h-9 shadow-sm hover:border-[#C00000] transition-all text-xs font-bold text-gray-700">
                                <Calendar size={14} className="text-gray-400" />
                                {customStart && customEnd ? (
                                    <span>{customStart.split('-').reverse().join('/')} até {customEnd.split('-').reverse().join('/')}</span>
                                ) : (
                                    <span className="text-gray-400">Personalizado...</span>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="end">
                            <ExpressCalendar 
                                startDate={customStart} 
                                endDate={customEnd} 
                                onChange={(start, end) => {
                                    setCustomStart(start || "");
                                    setCustomEnd(end || "");
                                    if (start && end) setPeriod("custom");
                                }} 
                            />
                        </PopoverContent>
                    </Popover>
                    {saved ? (
                        <a href={saved.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all">
                            <Globe size={14} /> Link Gerado
                        </a>
                    ) : (
                        <button onClick={() => saveReport()} disabled={saving} className="flex items-center gap-2 bg-[#C00000] text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-red-700 active:scale-95 transition-all">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Gerar Relatório
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-6 space-y-6">

                {/* ── KPIs Hero (As 6 Métricas) ────────────────────────────────────────── */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <BarChart2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Métricas Principais</h2>
                            <p className="text-xs text-gray-400 font-medium">Você pode revisar e alterar esses números antes de gerar o relatório final</p>
                        </div>
                        <div className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 bg-green-50 text-green-700">
                           ● {data?.ga4?.status === 'active' ? 'GA4 Ativo' : 'Dados Locais'}
                        </div>
                        {isFetching && <Loader2 size={16} className="animate-spin text-blue-400 ml-4" />}
                    </div>

                    {/* Divisão: Top Funnel vs Bottom Funnel */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Bloco 1: Visualizações / Descoberta */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Descoberta (Views)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <EditableNumber 
                                    label="Views Gerais" 
                                    value={viewsGeral} 
                                    onChange={v => setOverrides({...overrides, views_geral: v})} 
                                    color="text-blue-600" 
                                />
                                <EditableNumber 
                                    label="Views por Segmentos" 
                                    value={viewsSegmento} 
                                    onChange={v => setOverrides({...overrides, views_segmento: v})} 
                                    color="text-indigo-600" 
                                />
                                <EditableNumber 
                                    label="Views por Cidades" 
                                    value={viewsCidade} 
                                    onChange={v => setOverrides({...overrides, views_cidade: v})} 
                                    color="text-teal-600" 
                                />
                                <EditableNumber 
                                    label="Busca Direta (Perfil)" 
                                    value={viewsDireto} 
                                    onChange={v => setOverrides({...overrides, views_direto: v})} 
                                    color="text-amber-600" 
                                />
                            </div>
                        </div>

                        {/* Bloco 2: Ações / Conversões */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Ações e Contatos (Cliques)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <EditableNumber 
                                    label="Cliques no Waze" 
                                    value={clicksWaze} 
                                    onChange={v => setOverrides({...overrides, clicks_waze: v})} 
                                    color="text-sky-600" 
                                />
                                <EditableNumber 
                                    label="Cliques no WhatsApp" 
                                    value={clicksWhats} 
                                    onChange={v => setOverrides({...overrides, clicks_whats: v})} 
                                    color="text-green-600" 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Tabela Detalhada (Cidades) ────────────────────────────── */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Globe size={16} className="text-gray-400" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Detalhamento por Cidade / Página</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-[10px] font-black uppercase">{cities.length} cidades</div>
                            <button onClick={addCity} className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1 hover:underline">
                                <Plus size={14} /> Adicionar Linha
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    <th className="px-8 py-4 w-[60%] min-w-[400px]">Cidade / Nome da Página</th>
                                    <th className="px-6 py-4 text-right">Views</th>
                                    <th className="px-6 py-4 text-right">Usuários</th>
                                    <th className="px-6 py-4 text-right border-l border-gray-100">Eventos</th>
                                    <th className="px-6 py-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {cities.map((city, idx) => (
                                    <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-4">
                                            <input
                                                className="w-full bg-transparent border-none text-[11px] font-bold text-blue-600 focus:ring-0 p-0"
                                                value={city.title}
                                                onChange={e => updateCity(idx, 'title', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <input
                                                type="number"
                                                className="w-20 bg-transparent border-none text-[11px] font-black text-gray-900 focus:ring-0 p-0 text-right"
                                                value={city.views}
                                                onChange={e => updateCity(idx, 'views', parseInt(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <input
                                                type="number"
                                                className="w-20 bg-transparent border-none text-[11px] font-black text-gray-900 focus:ring-0 p-0 text-right"
                                                value={city.users}
                                                onChange={e => updateCity(idx, 'users', parseInt(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right border-l border-gray-100">
                                            <input
                                                type="number"
                                                className="w-20 bg-transparent border-none text-[11px] font-black text-emerald-600 focus:ring-0 p-0 text-right"
                                                value={city.events}
                                                onChange={e => updateCity(idx, 'events', parseInt(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => removeCity(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {cities.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-gray-300 font-bold uppercase text-[10px]">Nenhuma cidade encontrada no GA4</td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-blue-50/50 border-t border-blue-100">
                                <tr className="text-[11px] font-black text-blue-900">
                                    <td className="px-8 py-4">TOTAL CALCULADO NA TABELA</td>
                                    <td className="px-6 py-4 text-right">{calculatedTotals.views.toLocaleString('pt-BR')}</td>
                                    <td className="px-6 py-4 text-right">{calculatedTotals.users.toLocaleString('pt-BR')}</td>
                                    <td className="px-6 py-4 text-right border-l border-blue-100">{calculatedTotals.events.toLocaleString('pt-BR')}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* ── Tabela (mantida para visualização de GA4 mas sem ser o destaque) ────────────────────────────────────────── */}

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar size={16} className="text-[#C00000]" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mensagem para o Cliente (Opcional)</p>
                    </div>
                    <textarea
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-6 text-sm focus:ring-2 focus:ring-red-100 focus:bg-white transition-all outline-none min-h-[120px]"
                        placeholder="Ex: Parabéns pelos resultados! Sua presença online cresceu este ano..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />
                </div>

            </div>

            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="max-w-3xl rounded-3xl p-8 bg-gray-50 border-gray-200 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <History size={24} className="text-[#C00000]" /> Histórico de Relatórios Gerados
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-6 max-h-[60vh] overflow-y-auto pr-2">
                        {history.length === 0 ? (
                            <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                                <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Nenhum relatório gerado ainda</p>
                            </div>
                        ) : (
                            history.map(h => (
                                <div key={h.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-black text-gray-900">{h.period_label}</p>
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${h.status === 'viewed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {h.status === 'viewed' ? 'Visualizado' : 'Gerado (Não Aberto)'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium">
                                            Gerado em: {new Date(h.created_at).toLocaleDateString('pt-BR')} às {new Date(h.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} por {h.generated_by?.name || 'Sistema'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/relatorio/${h.token}`);
                                            alert("Link copiado!");
                                        }} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors" title="Copiar Link">
                                            <Copy size={16} />
                                        </button>
                                        <a href={`/relatorio/${h.token}`} target="_blank" rel="noreferrer" className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors" title="Abrir Relatório">
                                            <ExternalLink size={16} />
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
