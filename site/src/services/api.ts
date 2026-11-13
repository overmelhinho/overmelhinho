import axios from 'axios';

const DEFAULT_TIMEOUT_MS = 10000;
const timeout = process.env.NEXT_PUBLIC_API_TIMEOUT
    ? parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT, 10)
    : DEFAULT_TIMEOUT_MS;

// Instância do Axios para o Front Público (Next.js)
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://dash.overmelhinho.com.br/api/v1',
    timeout,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
});

export default api;
