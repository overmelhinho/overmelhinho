'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, X, ChevronRight, Star, Clock, Sparkles } from 'lucide-react';
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

export const HeaderSearch = () => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<{ results: Suggestion[], categories: Suggestion[] }>({ results: [], categories: [] });
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { cityId, cityName } = useLocation();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const startVoiceSearch = async () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        try {
            setIsListening(true);
            const recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR';
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (event: any) => {
                const transcript = event.results?.[0]?.[0]?.transcript;
                if (transcript) {
                    setQuery(transcript);
                    if (event.results[0].isFinal) handleSearch(transcript);
                }
            };
            recognition.start();
        } catch (e) {
            setIsListening(false);
        }
    };

    const [isExpanded, setIsExpanded] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDesktop = mounted && typeof window !== 'undefined' && window.innerWidth > 1024;

    return (
        <div className={`relative flex-1 transition-all duration-500 z-[210] ${isExpanded ? 'fixed inset-x-0 top-0 h-20 bg-white px-6 flex items-center lg:relative lg:inset-auto lg:h-auto lg:bg-transparent lg:px-0' : 'max-w-[40px] md:max-w-md'}`} ref={dropdownRef}>
            <div className={`relative flex items-center bg-gray-50 border-2 transition-all duration-300 rounded-2xl ${isExpanded ? 'w-full px-4 py-3 border-brand-red bg-white' : 'w-10 h-10 md:w-full md:h-auto md:px-4 md:py-2 border-transparent hover:bg-gray-100'} ${isOpen ? 'border-brand-red bg-white shadow-lg' : ''}`}>
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`flex-shrink-0 transition-colors md:pointer-events-none ${isOpen || isExpanded ? 'text-brand-red' : 'text-gray-400'}`}
                >
                    <Search size={16} />
                </button>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    onFocus={() => { setIsOpen(query.length >= 2); setIsExpanded(true); }}
                    placeholder={isExpanded || isDesktop ? `Buscar em ${cityName || 'todas as cidades'}...` : ''}
                    className={`flex-1 bg-transparent border-none focus:ring-0 px-3 text-sm font-bold text-gray-900 placeholder:text-gray-400 outline-none ${isExpanded ? 'block' : 'hidden md:block'}`}
                />
                <div className={`flex items-center space-x-2 ${isExpanded || isDesktop ? 'flex' : 'hidden'}`}>
                    {query && (
                        <button onClick={() => setQuery('')} className="text-gray-300 hover:text-gray-600">
                            <X size={14} />
                        </button>
                    )}
                    <button 
                        onClick={startVoiceSearch}
                        className={`transition-colors ${isListening ? 'text-brand-red animate-pulse' : 'text-gray-400 hover:text-brand-red'}`}
                    >
                        <Mic size={16} />
                    </button>
                    {isExpanded && (
                        <button onClick={() => setIsExpanded(false)} className="lg:hidden text-gray-400 p-1">
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Dropdown Compacto */}
            {isOpen && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[1.5rem] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[210]">
                    <div className="max-h-[60vh] overflow-y-auto no-scrollbar py-2">
                        {suggestions.categories.length > 0 && (
                            <div className="px-4 py-2 border-b border-gray-50">
                                <div className="flex flex-wrap gap-1.5">
                                    {suggestions.categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleSearch(cat.title)}
                                            className="px-3 py-1 bg-gray-50 hover:bg-brand-red/5 hover:text-brand-red rounded-full text-[10px] font-black uppercase tracking-wider transition-all"
                                        >
                                            {cat.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="py-1">
                            {suggestions.results.length > 0 ? (
                                suggestions.results.map(res => (
                                    <div
                                        key={res.id}
                                        onClick={() => { router.push(`/cliente/${res.slug || res.id}`); setIsOpen(false); }}
                                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center space-x-3">
                                        {res.image && (
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0">
                                                <img src={res.image} className="w-full h-full object-cover" alt="" />
                                            </div>
                                        )}
                                            <div>
                                                <h5 className="font-black text-gray-900 text-sm leading-tight">{res.title}</h5>
                                                <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                    <Star size={10} className="mr-1 fill-yellow-400 text-yellow-400" /> 4.9
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-200 group-hover:text-brand-red group-hover:translate-x-1 transition-all" />
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-6 text-center">
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Nenhum resultado direto</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={() => handleSearch()}
                        className="w-full py-3 bg-gray-50 text-[10px] font-black text-brand-red uppercase tracking-widest hover:bg-gray-100 transition-colors border-t border-gray-100"
                    >
                        Ver todos os resultados
                    </button>
                </div>
            )}
        </div>
    );
};
