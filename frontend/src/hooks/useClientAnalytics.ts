import { useEffect, useRef } from 'react';
import ReactGA from "react-ga4";
import api from '@/services/api';

interface ClientAnalyticsData {
    id: number | string;
    segmento: string;
    cidade: string;
}

/**
 * Hook personalizado para disparar eventos do GA4 com dimensões customizadas
 * específicas para o contexto de um cliente (lojista/empresa).
 */
export function useClientAnalytics(clientData: ClientAnalyticsData | null) {
    const hasLogged = useRef(false);

    useEffect(() => {
        if (clientData && !hasLogged.current) {
            // 1. Dispara evento de Page View com Dimensões Customizadas (Frontend)
            ReactGA.send({
                hitType: "pageview",
                page: window.location.pathname,
                title: `Perfil - ${clientData.segmento}`,
                // Dimensões customizadas configuradas no GA4
                client_id: String(clientData.id),
                client_segment: clientData.segmento,
                client_city: clientData.cidade
            });

            // 2. Dispara evento explícito para o GA4 (Analytics Hub)
            ReactGA.event("view_client_profile", {
                client_id: String(clientData.id),
                client_segment: clientData.segmento,
                client_city: clientData.cidade
            });

            // 3. Notifica o backend para o Server-Side Tracking via Measurement Protocol
            // Usando post assíncrono para garantir que não bloqueie o usuário
            api.post('/v1/tracking/interaction', {
                cliente_id: clientData.id,
                interaction_type: 'page_view'
            }).catch(err => console.error("Erro no tracking server-side:", err));

            hasLogged.current = true;
        }
    }, [clientData]);

    /**
     * Função para rastrear interações críticas (WhatsApp, Waze)
     * Garantindo o disparo no GA4 (Frontend) e Measurement Protocol (Backend)
     */
    const trackInteraction = async (type: 'whatsapp_click' | 'waze_click' | 'social_click') => {
        if (!clientData) return;

        // Disparo Frontend (Garante tempo real se não houver AdBlock)
        ReactGA.event(type, {
            client_id: String(clientData.id),
            client_segment: clientData.segmento,
            client_city: clientData.cidade
        });

        // Disparo Backend (Garante dados se houver AdBlock)
        // Usamos post comum pois o redirecionamento costuma ser via window.open ou target_blank
        try {
            await api.post('/v1/tracking/interaction', {
                cliente_id: clientData.id,
                interaction_type: type
            });
        } catch (err) {
            console.error(`Falha no tracking ${type}:`, err);
        }
    };

    return { trackInteraction };
}
