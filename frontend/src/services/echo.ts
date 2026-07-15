import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import api from './api';

// Configuração global para o Echo
(window as any).Pusher = Pusher;

export const createEchoInstance = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    // Inteligência para deduzir o host do websockets baseado na API, se VITE_REVERB_HOST não existir
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.overmelhinho.com.br/api';
    let apiHost = window.location.hostname;
    let isHttps = true;
    try {
        const urlObj = new URL(apiUrl);
        apiHost = urlObj.hostname;
        isHttps = urlObj.protocol === 'https:';
    } catch (e) {}

    const wsHost = import.meta.env.VITE_REVERB_HOST || apiHost;
    const isTls = (import.meta.env.VITE_REVERB_SCHEME ?? (isHttps ? 'https' : 'http')) === 'https';
    const defaultPort = isTls ? 443 : 8080;

    return new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY || 'vermelhinho_key',
        wsHost: wsHost,
        wsPort: import.meta.env.VITE_REVERB_PORT || defaultPort,
        wssPort: import.meta.env.VITE_REVERB_PORT || defaultPort,
        forceTLS: isTls,
        enabledTransports: ['ws', 'wss'],
        // Usamos authorizer customizado para usar a instância do Axios (com interceptors, prefixos etc)
        authorizer: (channel: any, _options: any) => {
            return {
                authorize: (socketId: any, callback: any) => {
                    // As rotas de broadcast no laravel geralmente ficam em /api/broadcasting/auth
                    // Vamos fazer uma chamada direta pela instância api
                    api.post('/broadcasting/auth', {
                        socket_id: socketId,
                        channel_name: channel.name
                    })
                        .then(response => {
                            callback(false, response.data);
                        })
                        .catch(error => {
                            callback(true, error);
                        });
                }
            };
        },
    });
};
