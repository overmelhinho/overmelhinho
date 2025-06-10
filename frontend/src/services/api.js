import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://82.112.244.103:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Carregar token automaticamente se existir
const token = localStorage.getItem("token");
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export default api;
