import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import {
    Search,
    MapPin,
    Store,
    Star,
    Trash2,
    Zap,
    ArrowRight,
    MessageCircle,
    X,
    Sparkles,
    Copy,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProspectRadarPage: React.FC = () => {
    const [searching, setSearching] = useState(false);
    const [leads, setLeads] = useState<any[]>([]);
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [showPitch, setShowPitch] = useState(false);
    const [copied, setCopied] = useState(false);

    // Novo Sistema de Notificação (UX)
    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({
        show: false,
        message: '',
        type: 'info'
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
    };

    // Filtros (Conectados ao Banco)
    const [city, setCity] = useState('');
    const [segment, setSegment] = useState('');

    // 1. Busca Cidades
    const { data: cities } = useQuery({
        queryKey: ['cidades-radar'],
        queryFn: async () => {
            const response = await api.get('/v1/cidades');
            return response.data.data;
        }
    });

    // 2. Busca Segmentos
    const { data: segments } = useQuery({
        queryKey: ['segmentos-radar'],
        queryFn: async () => {
            const response = await api.get('/v1/segmentos');
            return response.data.data;
        }
    });

    // 3. Busca de Prospecção Real
    const {
        data: prospectData,
        isLoading: loadingLeads,
        refetch: searchLeads,
        isRefetching
    } = useQuery({
        queryKey: ['prospect-search', city, segment],
        queryFn: async () => {
            if (!city || !segment) return [];
            const response = await api.get('/v1/prospect/search', {
                params: { cidade: city, segmento: segment }
            });
            return response.data.data;
        },
        enabled: false // Só busca quando o usuário clicar
    });

    // Sincronizar prospectData com leads local (para permitir descartar)
    React.useEffect(() => {
        if (prospectData) {
            setLeads(prospectData);
        }
    }, [prospectData]);

    const handleSearch = () => {
        if (!city || !segment) return;
        searchLeads();
    };

    const isInternalLoading = loadingLeads || isRefetching;

    const handleDiscard = (id: string) => {
        setLeads(prev => prev.filter(l => l.google_place_id !== id));
    };

    const handleOpenPitch = async (lead: any) => {
        // Se o lead não tem telefone, vamos buscar os detalhes agora (pra ter o WhatsApp real)
        if (!lead.telefone || lead.telefone === '') {
            showToast('Buscando contatos do Google...', 'info');
            try {
                const detailResponse = await api.get('/v1/lead-intel/fetch', {
                    params: { query: lead.nome, cidade: city }
                });
                const fullDados = detailResponse.data.dados;

                // Mescla os dados extras (telefone, site, etc)
                const enrichedLead = {
                    ...lead,
                    telefone: fullDados.telefone || '',
                    website: fullDados.website || '',
                };

                setSelectedLead(enrichedLead);
            } catch (error) {
                setSelectedLead(lead);
            }
        } else {
            setSelectedLead(lead);
        }
        setShowPitch(true);
    };

    const copyToClipboard = () => {
        const text = `Olá, tudo bem? \uD83E\uDD1D\n\nSou do portal *O Vermelhinho*.\n\nAcabei de ver a empresa *${selectedLead?.nome}* aqui no Google com uma nota excelente (*${selectedLead?.rating} estrelas*), parabéns pelo trabalho! \uD83D\uDC4F\n\nNotei que vocês ainda não aparecem com destaque no nosso portal, que hoje recebe mais de *200 mil acessos mensais* só aqui na Serra Gaúcha. \uD83D\uDE80\n\nTivemos muitas buscas recentes por *${selectedLead?.segmento}* em *${city || 'sua região'}* e gostaria de te ajudar a captar esses clientes que já estão procurando pelo seu serviço.\n\nTeria 2 minutinhos para eu te mostrar como te colocar no topo das nossas buscas? \uD83D\uDE0A`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        showToast('Pitch premium copiado!', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = () => {
        const phone = selectedLead?.telefone?.replace(/\D/g, '');
        if (!phone) {
            showToast('Ops! Telefone não disponível para este lead.', 'error');
            return;
        }
        const text = `Olá, tudo bem? \uD83E\uDD1D\n\nSou do portal *O Vermelhinho*.\n\nAcabei de ver a empresa *${selectedLead?.nome}* aqui no Google com uma nota excelente (*${selectedLead?.rating} estrelas*), parabéns pelo trabalho! \uD83D\uDC4F\n\nNotei que vocês ainda não aparecem com destaque no nosso portal, que hoje recebe mais de *200 mil acessos mensais* só aqui na Serra Gaúcha. \uD83D\uDE80\n\nTivemos muitas buscas recentes por *${selectedLead?.segmento}* em *${city || 'sua região'}* e gostaria de te ajudar a captar esses clientes que já estão procurando pelo seu serviço.\n\nTeria 2 minutinhos para eu te mostrar como te colocar no topo das nossas buscas? \uD83D\uDE0A`;

        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, '_blank');
        showToast('Abrindo WhatsApp...', 'info');
    };

    const handleAddToFunnel = async () => {
        try {
            const resp = await api.post('/v1/prospect/convert-to-lead', {
                nome: selectedLead.nome,
                google_place_id: selectedLead.google_place_id,
                endereco: selectedLead.endereco,
                telefone: selectedLead.telefone,
                segmento: selectedLead.segmento,
                cidade: city
            });
            showToast(resp.data.message || 'Lead adicionado com sucesso!', 'success');
            setShowPitch(false);
            handleDiscard(selectedLead.google_place_id); // Remove da lista de prospecção
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Falha ao adicionar ao funil. Tente novamente.';
            showToast(msg, 'error');
        }
    };

    return (
        <div className="min-h-screen bg-[#FCFAF8] pb-24 font-sans text-slate-900">
            {/* 1. HEADER & BUSCA */}
            <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
                <header className="space-y-2">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl md:text-6xl font-serif font-bold text-slate-800 tracking-tight"
                    >
                        Radar <span className="text-[#B70F0A]">Google</span>
                    </motion.h1>
                    <p className="text-slate-500 text-lg md:text-xl font-medium">Encontre empresas que ainda não estão no nosso radar.</p>
                </header>

                {/* Bento Search Box */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-4 md:p-6 rounded-[2.5rem] shadow-md border border-slate-100 flex flex-col md:flex-row gap-4 items-stretch"
                >
                    <div className="flex-1 relative group">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#B70F0A] transition-colors z-10" size={20} />
                        <select
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-full border-none focus:ring-2 focus:ring-red-100 outline-none text-slate-700 font-bold cursor-pointer appearance-none transition-all relative"
                        >
                            <option value="">Selecione a Cidade</option>
                            {cities?.map((c: any) => (
                                <option key={c.id} value={c.nome}>{c.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 relative group">
                        <Store className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#B70F0A] transition-colors z-10" size={20} />
                        <select
                            value={segment}
                            onChange={(e) => setSegment(e.target.value)}
                            className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-full border-none focus:ring-2 focus:ring-red-100 outline-none text-slate-700 font-bold cursor-pointer appearance-none transition-all relative"
                        >
                            <option value="">Selecione o Segmento</option>
                            {segments?.map((s: any) => (
                                <option key={s.id} value={s.nome}>{s.nome}</option>
                            ))}
                        </select>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSearch}
                        className="bg-[#B70F0A] text-white px-10 py-5 rounded-full font-bold shadow-lg shadow-red-200 flex items-center justify-center gap-3 transition-all"
                    >
                        {isInternalLoading ? <Loader /> : <Zap size={20} fill="currentColor" />}
                        Buscar Novos Leads
                    </motion.button>
                </motion.div>

                {/* 2. GRID DE RESULTADOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {leads.map((lead: any) => (
                            <motion.div
                                key={lead.google_place_id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                transition={{ delay: 0.1 }}
                                className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                            <Store size={24} />
                                        </div>
                                        <div className="bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-black shadow-inner">
                                            <Star size={14} fill="currentColor" />
                                            {lead.rating}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 leading-tight">{lead.nome}</h3>
                                        <p className="text-xs text-[#B70F0A] font-black uppercase tracking-widest mt-1">{lead.segmento}</p>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                                            <MapPin size={14} className="shrink-0" />
                                            <span className="truncate">{lead.endereco}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                                            <MessageCircle size={14} className="shrink-0" />
                                            <span>{lead.telefone}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-8">
                                    <button
                                        onClick={() => handleDiscard(lead.google_place_id)}
                                        className="flex-1 p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors flex items-center justify-center active:scale-95"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleOpenPitch(lead)}
                                        className="flex-[3] bg-emerald-50 text-emerald-700 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all active:scale-95"
                                    >
                                        <Sparkles size={18} fill="currentColor" />
                                        Prospectar
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {leads.length === 0 && !isInternalLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-20 text-center space-y-4"
                    >
                        <SearchX />
                        <h2 className="text-2xl font-serif text-slate-400 italic">Nada por aqui... tente outra busca.</h2>
                    </motion.div>
                )}
            </div>

            {/* 3. MODAL DE PITCH IA */}
            <AnimatePresence>
                {showPitch && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                            onClick={() => setShowPitch(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 50 }}
                            className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl p-8 space-y-6"
                        >
                            <button
                                onClick={() => setShowPitch(false)}
                                className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-red-50 text-[#B70F0A] rounded-2xl flex items-center justify-center">
                                    <Sparkles size={28} fill="currentColor" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Pitch Estratégico IA</h2>
                                    <p className="text-slate-400 text-sm font-medium">Personalizado para {selectedLead?.nome}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative group">
                                <p className="text-slate-600 leading-relaxed font-medium">
                                    "Olá, tudo bem? 🤝 Sou do portal <span className="text-[#B70F0A] font-black">O Vermelhinho</span>. Acabei de ver a empresa <span className="font-black text-slate-800">*{selectedLead?.nome}*</span> aqui no Google com uma nota excelente <span className="text-yellow-600 font-black">({selectedLead?.rating} estrelas)</span>!
                                    Notei que vocês ainda não aparecem com destaque no nosso portal, que hoje recebe mais de <span className="text-slate-900 font-bold underline italic">200 mil acessos mensais</span>. Tivemos muitas buscas recentes por
                                    <span className="text-[#B70F0A] font-black"> {selectedLead?.segmento}</span> em
                                    <span className="font-black text-slate-800"> {city || 'sua região'}</span>. Teria 2 minutinhos?"
                                </p>
                                <button
                                    onClick={copyToClipboard}
                                    className="absolute -bottom-3 -right-3 w-12 h-12 bg-white text-slate-400 shadow-lg rounded-2xl flex items-center justify-center hover:text-[#B70F0A] transition-all"
                                >
                                    {copied ? <CheckCircle2 className="text-emerald-500" size={20} /> : <Copy size={20} />}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleAddToFunnel}
                                    className="bg-slate-900 text-white p-5 rounded-3xl font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all outline-none"
                                >
                                    Adicionar ao Funil
                                </button>
                                <button
                                    onClick={handleWhatsApp}
                                    className="bg-emerald-500 text-white p-5 rounded-3xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 active:scale-95 transition-all outline-none"
                                >
                                    <ArrowRight size={20} />
                                    Enviar WhatsApp
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* 4. TOAST NOTIFICATION (Premium UX) */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md min-w-[300px]
                            ${toast.type === 'success' ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' :
                                toast.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800' :
                                    'bg-slate-800/90 border-slate-700 text-white'}`}
                    >
                        {toast.type === 'success' && <CheckCircle2 className="text-emerald-500" size={20} />}
                        {toast.type === 'error' && <X className="text-red-500" size={20} />}
                        {toast.type === 'info' && <Sparkles className="text-sky-400" size={20} />}
                        <span className="font-bold">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Loader = () => <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Zap size={20} /></motion.div>;
const SearchX = () => (
    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
        <MapPin size={48} strokeWidth={1} />
    </div>
);

export default ProspectRadarPage;
