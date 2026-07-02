// c:\Dev\overmelhinho\site\src\components\GlobalPopup.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAds } from '@/hooks/useAds';
import { useLocation } from '@/contexts/LocationContext';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function GlobalPopup() {
    const { cityId } = useLocation();
    const { trackAdInteraction } = useAnalytics();
    const [isOpen, setIsOpen] = useState(false);
    const [ad, setAd] = useState<any>(null);
    const [trackedView, setTrackedView] = useState(false);

    const { data: ads } = useAds({ 
        city_id: cityId, 
        tipo: 'POPUP' 
    });

    useEffect(() => {
        if (!ads || ads.length === 0) return;

        // Regra: 1 exibição por dia por usuário (localStorage)
        const lastShow = localStorage.getItem('last_popup_show');
        const today = new Date().toDateString();

        if (lastShow !== today) {
            setAd(ads[0]); // Pega o primeiro popup ativo
            setIsOpen(true);
            // Grava imediatamente para evitar que exiba de novo se o usuário sair sem fechar
            localStorage.setItem('last_popup_show', today);
        }
    }, [ads]);

    // Rastreia a visualização quando o popup abre
    useEffect(() => {
        if (isOpen && ad && !trackedView) {
            trackAdInteraction(ad.id, 'view', 'POPUP_GLOBAL', ad.cliente.id);
            setTrackedView(true);
        }
    }, [isOpen, ad, trackedView]);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('last_popup_show', new Date().toDateString());
    };

    if (!ad || !isOpen) return null;

    const midia = ad.midias['POPUP'] || Object.values(ad.midias)[0];
    const imageUrl = (typeof window !== 'undefined' && window.innerWidth < 768) 
        ? (midia.mobile?.url || midia.desktop?.url) 
        : (midia.desktop?.url || midia.mobile?.url);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />
                
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 50 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-[min(450px,90vw)] overflow-visible"
                >
                    <button 
                        onClick={handleClose}
                        className="absolute -top-4 -right-4 z-[1010] w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-black transition-all active:scale-90 border-2 border-white"
                    >
                        <X size={20} />
                    </button>

                    <div 
                        className="relative overflow-hidden cursor-pointer rounded-2xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] bg-slate-100"
                        onClick={() => {
                            if (ad.url) {
                                trackAdInteraction(ad.id, 'click', 'POPUP_GLOBAL', ad.cliente.id);
                                window.open(ad.url, '_blank');
                            }
                            handleClose();
                        }}
                    >
                        <img 
                            src={imageUrl} 
                            alt={ad.nome} 
                            className="w-full h-auto max-h-[80vh] object-contain block mx-auto"
                        />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
