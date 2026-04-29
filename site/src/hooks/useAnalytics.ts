'use client';

import api from '@/services/api';

type InteractionType = 'page_view' | 'whatsapp_click' | 'waze_click' | 'social_click' | 'call_click' | 'share_click';

export const useAnalytics = () => {

    /**
     * Rastreia uma interação com um cliente (WhatsApp, Waze, etc)
     * Envia tanto para o banco de dados quanto para o GA4 via Backend
     */
    const trackInteraction = async (clienteId: number, type: InteractionType, city?: string) => {
        try {
            await api.post('/tracking/interaction', {
                cliente_id: clienteId,
                interaction_type: type,
                city: city
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

    /**
     * Rastreia uma interação com anúncio (banner/popup)
     */
    const trackAdInteraction = async (campanhaId: number, type: 'view' | 'click', placement?: string, clienteId?: number) => {
        try {
            await api.post('/tracking/ad-interaction', {
                campanha_id: campanhaId,
                type,
                placement,
                cliente_id: clienteId
            });
        } catch (error) {
            console.error('Erro ao rastrear interação de anúncio:', error);
        }
    };

    return {
        trackInteraction,
        trackSearch,
        trackAdInteraction
    };
};
