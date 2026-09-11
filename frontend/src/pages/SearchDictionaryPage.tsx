import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import {
    Search,
    BookA,
    Zap,
    X,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Radar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SearchDictionaryPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({
        show: false,
        message: '',
        type: 'info'
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
    };

    // State for new manual correction
    const [newTypo, setNewTypo] = useState('');
    const [newCorrection, setNewCorrection] = useState('');

    // Fetch Corrections
    const { data: correctionsData, isLoading: loadingCorrections } = useQuery({
        queryKey: ['search-corrections'],
        queryFn: async () => {
            const response = await api.get('/v1/admin/search-corrections');
            return response.data.data;
        }
    });

    // Fetch Suggestions (Searches with 0 results)
    const { data: suggestionsData, isLoading: loadingSuggestions } = useQuery({
        queryKey: ['search-suggestions'],
        queryFn: async () => {
            const response = await api.get('/v1/admin/search-corrections/suggestions', { params: { days: 30, limit: 10 } });
            return response.data.data;
        }
    });

    // Create Correction Mutation
    const createMutation = useMutation({
        mutationFn: async (data: { typo: string, correction: string }) => {
            return await api.post('/v1/admin/search-corrections', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['search-corrections'] });
            queryClient.invalidateQueries({ queryKey: ['search-suggestions'] });
            showToast('Correção adicionada com sucesso!', 'success');
            setNewTypo('');
            setNewCorrection('');
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || 'Erro ao adicionar.';
            showToast(msg, 'error');
        }
    });

    // Delete Correction Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return await api.delete(`/v1/admin/search-corrections/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['search-corrections'] });
            showToast('Removido com sucesso!', 'success');
        }
    });

    const handleManualAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTypo || !newCorrection) return;
        createMutation.mutate({ typo: newTypo, correction: newCorrection });
    };

    const handleApproveSuggestion = (suggestion: any) => {
        // We prompt the user or inline edit, but for UX let's just prefill the form and focus it.
        setNewTypo(suggestion.term);
        // focus the correction input intuitively? For now just prefill.
        setNewCorrection('');
        showToast('Termo carregado. Digite a correção e salve.', 'info');
    };

    return (
        <div className="min-h-screen bg-[#FCFAF8] pb-24 font-sans text-slate-900">
            {/* HEADER */}
            <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
                <header className="space-y-2">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl md:text-5xl font-serif font-bold text-slate-800 tracking-tight flex items-center gap-4"
                    >
                        <BookA className="text-[#B70F0A]" size={40} />
                        Dicionário de <span className="text-[#B70F0A]">Busca</span>
                    </motion.h1>
                    <p className="text-slate-500 text-lg font-medium max-w-2xl">
                        Ensine o algoritmo a entender erros de digitação. Se o usuário busca "balet", ele deve encontrar os resultados de "ballet".
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* COLUNA ESQUERDA: ADICIONAR E LISTA */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* ADICIONAR MANUALMENTE */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col"
                        >
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Plus className="text-emerald-500" /> Nova Correção
                            </h2>
                            <form onSubmit={handleManualAdd} className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 block">Se digitarem errado:</label>
                                    <input
                                        type="text"
                                        value={newTypo}
                                        onChange={e => setNewTypo(e.target.value)}
                                        placeholder="ex: balet"
                                        className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-100 outline-none text-slate-700 font-bold"
                                    />
                                </div>
                                <div className="flex items-center justify-center pt-6 text-slate-300 hidden md:flex">
                                    <TrendingUp size={24} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 block">O sistema vai buscar:</label>
                                    <input
                                        type="text"
                                        value={newCorrection}
                                        onChange={e => setNewCorrection(e.target.value)}
                                        placeholder="ex: ballet"
                                        className="w-full px-5 py-4 bg-emerald-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-200 outline-none text-emerald-900 font-bold placeholder-emerald-300"
                                    />
                                </div>
                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending || !newTypo || !newCorrection}
                                        className="w-full md:w-auto h-full px-8 py-4 bg-[#B70F0A] text-white rounded-2xl font-bold shadow-lg shadow-red-200 hover:bg-red-800 transition-all disabled:opacity-50"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </form>
                        </motion.div>

                        {/* LISTA ATUAL */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100"
                        >
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <BookA className="text-blue-500" /> Dicionário Ativo
                            </h2>
                            {loadingCorrections ? (
                                <div className="py-10 text-center text-slate-400">Carregando...</div>
                            ) : correctionsData?.length === 0 ? (
                                <div className="py-10 text-center text-slate-400 italic">Nenhuma correção cadastrada.</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <AnimatePresence>
                                        {correctionsData?.map((item: any) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.5 }}
                                                className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-3 min-w-0 pr-3">
                                                    <span className="text-slate-500 font-bold line-through flex-1" style={{ wordBreak: 'break-word' }}>{item.typo}</span>
                                                    <TrendingUp className="text-slate-300 shrink-0" size={16} />
                                                    <span className="text-emerald-600 font-black flex-1 text-right" style={{ wordBreak: 'break-word' }}>{item.correction}</span>
                                                </div>
                                                <button
                                                    onClick={() => deleteMutation.mutate(item.id)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* COLUNA DIREITA: RADAR DE FALHAS */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-[#B70F0A] p-6 md:p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden"
                        >
                            {/* Bg decoration */}
                            <Radar className="absolute -top-10 -right-10 text-white/10" size={200} />
                            
                            <h2 className="text-xl font-bold mb-2 flex items-center gap-2 relative z-10">
                                <AlertCircle /> Radar de Oportunidades
                            </h2>
                            <p className="text-red-100 text-sm mb-6 relative z-10 font-medium">
                                Buscas recentes que não retornaram nenhum resultado. Podem ser erros de digitação ou novos serviços!
                            </p>

                            <div className="space-y-3 relative z-10">
                                {loadingSuggestions ? (
                                    <div className="py-4 text-center text-red-200">Rastreando buscas...</div>
                                ) : suggestionsData?.length === 0 ? (
                                    <div className="bg-white/10 p-4 rounded-2xl text-center backdrop-blur-sm">
                                        <CheckCircle2 className="mx-auto mb-2 text-emerald-400" />
                                        <p className="text-sm font-bold">Nenhuma falha recente!</p>
                                    </div>
                                ) : (
                                    suggestionsData?.map((sugg: any, i: number) => (
                                        <div key={i} className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm flex items-center justify-between group hover:bg-white/20 transition-all">
                                            <div className="flex-1 min-w-0 pr-3">
                                                <h4 
                                                    className="font-bold text-lg leading-tight mb-1" 
                                                    style={{ wordBreak: 'break-word' }} 
                                                    title={sugg.term}
                                                >
                                                    "{sugg.term}"
                                                </h4>
                                                <p className="text-red-200 text-xs font-medium">{sugg.total_searches} buscas frustradas</p>
                                            </div>
                                            <button
                                                onClick={() => handleApproveSuggestion(sugg)}
                                                className="w-10 h-10 bg-white text-[#B70F0A] rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shrink-0"
                                                title="Adicionar ao Dicionário"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* TOAST NOTIFICATION */}
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
                        {toast.type === 'info' && <Search className="text-sky-400" size={20} />}
                        <span className="font-bold">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchDictionaryPage;
