import axios from "axios";

const baseURL =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
  "https://api.overmelhinho.com.br/api";

const api = axios.create({
  baseURL,
  timeout: 60000,
});

// Adiciona o token JWT nas requisições, se existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔒 FASE 2 — Interceptor de resposta: trata 401 (token inválido/expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Só limpa e redireciona se: (1) é erro 401 E (2) o dispositivo está online
    // Offline: não toca no token — o acesso via cache continua válido
    if (error.response?.status === 401 && navigator.onLine) {
      localStorage.removeItem("token");
      localStorage.removeItem("ov_cached_user");
      // Redireciona apenas se não estiver já na tela de login
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/autorizar")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

