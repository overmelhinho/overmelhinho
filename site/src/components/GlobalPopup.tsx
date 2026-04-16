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
                    className="relative w-full max-w-lg bg-white rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border-4 border-white gummy-card"
                >
                    <button 
                        onClick={handleClose}
                        className="absolute top-6 right-6 z-20 w-12 h-12 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all active:scale-90"
                    >
                        <X size={24} />
                    </button>

                    <div 
                        className="relative aspect-square md:aspect-[4/5] overflow-hidden cursor-pointer"
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
                            className="w-full h-full object-cover"
                        />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
