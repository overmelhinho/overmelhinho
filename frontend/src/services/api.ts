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

export default api;
