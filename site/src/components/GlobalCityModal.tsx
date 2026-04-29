'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X, MapPin, CheckCircle2 } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { useCidades } from '@/hooks/useCidades';

export default function GlobalCityModal() {
    const { isCityModalOpen, setIsCityModalOpen, cityName, setCity } = useLocation();
    const { data: cidades } = useCidades();
    const [citySearchQuery, setCitySearchQuery] = useState('');

    const filteredCities = useMemo(() => {
        if (!cidades) return [];
        return cidades.filter((city: any) =>
            city.nome.toLowerCase().includes(citySearchQuery.toLowerCase())
        );
    }, [cidades, citySearchQuery]);

    return (
        <AnimatePresence>
            {isCityModalOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCityModalOpen(false)}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden gummy-card"
                    >
                        <div className="p-10 space-y-8">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-gray-900 font-serif italic tracking-tighter">Mudar Região</h3>
                                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Encontre serviços em outras cidades</p>
                                </div>
                                <button onClick={() => setIsCityModalOpen(false)} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 active:scale-75 transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="relative">
                                <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-red" size={20} />
                                <input
                                    type="text"
                                    value={citySearchQuery}
                                    onChange={(e) => setCitySearchQuery(e.target.value)}
                                    placeholder="Digite o nome da cidade..."
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-red/20 focus:bg-white rounded-3xl py-5 pl-14 pr-6 font-bold text-gray-900 transition-all outline-none shadow-inner"
                                />
                            </div>

                            <div className="space-y-4 flex flex-col min-h-0">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-2 flex-shrink-0">Sugestões próximos de você</p>
                                
                                <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-2 max-h-[40vh] md:max-h-[50vh] custom-scrollbar scroll-smooth">
                                    {filteredCities.length > 0 ? (
                                        filteredCities.map((city: any) => (
                                            <button
                                                key={city.id}
                                                onClick={() => {
                                                    setCity(city.id, city.nome);
                                                    setIsCityModalOpen(false);
                                                }}
                                                className={`flex items-center justify-between p-4 md:p-5 rounded-3xl border-2 transition-all flex-shrink-0 ${cityName === city.nome ? 'bg-brand-red/5 border-brand-red' : 'bg-white border-gray-50 hover:bg-gray-50'}`}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cityName === city.nome ? 'bg-brand-red text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        <MapPin size={20} />
                                                    </div>
                                                    <span className={`font-black tracking-tight text-sm md:text-base ${cityName === city.nome ? 'text-brand-red' : 'text-gray-900'}`}>{city.nome}</span>
                                                </div>
                                                {cityName === city.nome && <CheckCircle2 size={20} className="text-brand-red flex-shrink-0" />}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-10 text-center space-y-2">
                                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-200">
                                                <MapPin size={24} />
                                            </div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nenhuma cidade encontrada</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-6 text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-50">O Vermelhinho • Geo Intelligence v2.0</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
