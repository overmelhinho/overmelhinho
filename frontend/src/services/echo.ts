import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import api from './api';

// Configuração global para o Echo
(window as any).Pusher = Pusher;

export const createEchoInstance = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    return new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY || 'vermelhinho_key',
        wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
        wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
        wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
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
