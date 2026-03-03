'use client';

import api from '@/services/api';

type InteractionType = 'page_view' | 'whatsapp_click' | 'waze_click' | 'social_click';

export const useAnalytics = () => {

    /**
     * Rastreia uma interação com um cliente (WhatsApp, Waze, etc)
     * Envia tanto para o banco de dados quanto para o GA4 via Backend
     */
    const trackInteraction = async (clienteId: number, type: InteractionType) => {
        try {
            await api.post('/tracking/interaction', {
                cliente_id: clienteId,
                interaction_type: type
            });
        } catch (error) {
            console.error('Erro ao rastrear interação:', error);
        }
    };

    /**
     * Rastreia uma busca realizada no portal
     * Alimenta o Radar de Oportunidades
     */
    const trackSearch = async (term: string, city: string = 'Geral', resultsCount: number = 0) => {
        try {
            await api.post('/tracking/search', {
                term,
                city,
                results_count: resultsCount
            });
        } catch (error) {
            console.error('Erro ao rastrear busca:', error);
        }
    };

    return {
        trackInteraction,
        trackSearch
    };
};
