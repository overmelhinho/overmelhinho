import ReactGA from "react-ga4";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? "https://api.overmelhinho.com.br/api";

type InteractionType = 'page_view' | 'whatsapp_click' | 'waze_click' | 'social_click';

export const trackInteraction = async (clientId: number, type: InteractionType, params?: any) => {
    // 1. GA4 Track
    ReactGA.event(type, {
        client_id: String(clientId),
        ...params
    });

    // 2. Server-side / Database Track
    try {
        await fetch(`${API_BASE}/v1/tracking/interaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cliente_id: clientId,
                interaction_type: type
            })
        });
    } catch (error) {
        console.error('Tracking failed:', error);
    }
};

