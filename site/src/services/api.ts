import axios from 'axios';

// Instância do Axios para o Front Público (Next.js)
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
});

export default api;
