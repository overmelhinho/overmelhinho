import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://82.112.244.103:8000/api";

console.log("VITE_API_BASE_URL carregado:", baseURL);

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;
