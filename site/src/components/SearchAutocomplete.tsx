'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Mic, Sparkles, MapPin, Star, ChevronRight, X, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocation } from '@/contexts/LocationContext';
import api from '@/services/api';

interface Suggestion {
    id: number;
    slug?: string;
    title: string;
    image?: string;
    type: 'client' | 'category';
    priority?: boolean;
}

export const SearchAutocomplete = () => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<{ results: Suggestion[], categories: Suggestion[] }>({ results: [], categories: [] });
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { cityId, cityName } = useLocation();

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounce para as sugestões
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (query.trim().length < 2) {
                setSuggestions({ results: [], categories: [] });
                return;
            }
            try {
                const res = await api.get(`/public/search/suggestions`, {
                    params: { q: query, city_id: cityId }
                });

                // ✅ Limpeza de duplicados por slug/id antes de salvar no estado
                const cleanedResults = (res.data.results || []).filter((item: any, index: number, self: any[]) =>
                    index === self.findIndex((t: any) => (t.id === item.id))
                );

                setSuggestions({
                    ...res.data,
                    results: cleanedResults
                });
                setIsOpen(true);
            } catch (error) {
                console.error("Erro ao buscar sugestões", error);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [query, cityId]);

    const handleSearch = (term: string = query) => {
        if (!term.trim()) return;
        setIsOpen(false);
        router.push(`/busca?q=${encodeURIComponent(term)}${cityId ? `&city_id=${cityId}` : ''}`);
    };

    const startVoiceSearch = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Seu navegador não suporta busca por voz. Tente usar o Google Chrome ou Safari.');
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR';
            recognition.interimResults = true;
            recognition.continuous = false;

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    alert('Permissão de microfone negada. Ative o microfone nas configurações do seu navegador.');
                } else if (event.error === 'network') {
                    alert('Erro de rede na busca por voz. Verifique sua conexão.');
                }
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setQuery(transcript);

                if (event.results[0].isFinal) {
                    handleSearch(transcript);
                }
            };

            recognition.start();
        } catch (err) {
            console.error('Error starting speech recognition:', err);
            setIsListening(false);
        }
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto z-[200]" ref={dropdownRef}>
            {/* INPUT PRINCIPAL */}
            <div className={`relative gummy-card bg-white rounded-full p-2 flex items-center shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] border-4 transition-all duration-700 ${isListening ? 'border-brand-red ring-[15px] ring-red-100/30' : 'border-white'} ${isOpen ? 'rounded-b-none' : ''}`}>
                <div className={`pl-2 md:pl-4 flex-shrink-0 ${isListening ? 'text-brand-red animate-pulse' : 'text-gray-500'}`}>
                    <Search size={20} className="md:w-6 md:h-6" strokeWidth={3} />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    onFocus={() => setIsOpen(query.length >= 2)}
                    placeholder={isListening ? "Processando sua voz..." : `O que você precisa em ${cityName || 'sua região'}?`}
                    className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 px-2 py-3 md:py-4 text-gray-900 font-black placeholder:text-gray-400 text-sm md:text-2xl font-sans outline-none"
                />
                <div className="flex items-center space-x-1 md:space-x-2 pr-1 md:pr-2 flex-shrink-0">
                    {query && (
                        <button onClick={() => setQuery('')} className="p-2 md:p-3 text-gray-300 hover:text-gray-600 transition-colors">
                            <X size={18} className="md:w-5 md:h-5" />
                        </button>
                    )}
                    <button
                        onClick={startVoiceSearch}
                        className={`p-3 md:p-4 rounded-full transition-all duration-500 active:scale-75 cursor-pointer ${isListening ? 'bg-brand-red text-white scale-110 md:scale-125' : 'bg-gray-50 text-brand-red hover:bg-gray-100'}`}
                    >
                        <Mic size={20} className="md:w-6 md:h-6" fill={isListening ? "currentColor" : "none"} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* DROPDOWN DE SUGESTÕES */}
            {isOpen && (query.length >= 2) && (
                <div className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-b-[2.5rem] border-x-4 border-b-4 border-white overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    <div className="max-h-[60vh] overflow-y-auto no-scrollbar py-4">

                        {/* CATEGORIAS */}
                        {suggestions.categories.length > 0 && (
                            <div className="px-6 mb-6">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Serviços e Categorias</h4>
                                <div className="flex flex-wrap gap-2">
                                    {suggestions.categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleSearch(cat.title)}
                                            className="px-4 py-2 bg-gray-50 hover:bg-brand-red/5 hover:text-brand-red border border-gray-100 rounded-full text-xs font-bold transition-all"
                                        >
                                            {cat.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* RESULTADOS EMPRESAS */}
                        <div className="space-y-1">
                            {suggestions.results.length > 0 ? (
                                <>
                                    <div className="px-6 py-2">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Empresas e Parceiros</h4>
                                    </div>
                                    {suggestions.results.map(res => (
                                        <div
                                            key={res.id}
                                            onClick={() => router.push(`/cliente/${res.slug || res.id}`)}
                                            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shadow-sm flex-shrink-0">
                                                    <img src={res.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100"} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <h5 className="font-black text-gray-900 font-serif italic tracking-tight text-lg">{res.title}</h5>
                                                        {res.priority && (
                                                            <div className="bg-brand-red/10 px-2 py-0.5 rounded text-[8px] font-black text-brand-red uppercase tracking-widest">Premium</div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                        <Star size={10} className="mr-1 fill-yellow-400 text-yellow-400" /> 4.9 • Aberto Agora
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-200 group-hover:text-brand-red group-hover:translate-x-1 transition-all" />
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="px-6 py-8 text-center space-y-2">
                                    <Sparkles size={24} className="mx-auto text-gray-200" />
                                    <p className="text-xs font-bold text-gray-400">Continue digitando para ver sugestões...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FOOTER DO DROPDOWN */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <Clock size={12} />
                            <span>Resultados Instantâneos</span>
                        </div>
                        <button onClick={() => handleSearch()} className="text-[10px] font-black text-brand-red uppercase tracking-widest hover:underline">
                            Ver todos os resultados →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
