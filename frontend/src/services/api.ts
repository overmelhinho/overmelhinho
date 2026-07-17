import axios from "axios";

const baseURL =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
  "https://api.overmelhinho.com.br/api";

const api = axios.create({
  baseURL,
  timeout: 60000,
});

// Adiciona o token JWT nas requisições, se existir
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("token");
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // 🔒 FASE 4 — Intercepta Mutações Offline
  // Se não tem rede E é uma mutação E não é uma requisição da própria Outbox
  if (
    !navigator.onLine &&
    config.method &&
    ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase()) &&
    !config.headers['X-From-Outbox']
  ) {
    // Importa o SyncEngine dinamicamente para evitar ciclo de dependência
    const { addToOutbox } = await import('./SyncEngine');
    
    const id = await addToOutbox({
      method: config.method.toUpperCase() as any,
      url: config.url || '',
      data: config.data,
      headers: config.headers,
    });

    // Cancela a requisição real disparando um erro customizado,
    // mas que o nosso response interceptor vai transformar em "Sucesso Fake".
    return Promise.reject({
      isOfflineMock: true,
      config,
      offlineId: id,
    });
  }

  return config;
});

// 🔒 FASE 2/4 — Interceptor de resposta: trata 401 e mocks offline
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // FASE 4: Se for um erro falso gerado pelo interceptor offline, fingimos sucesso (Optimistic UI)
    if (error.isOfflineMock) {
      return Promise.resolve({
        data: { 
          success: true, 
          message: 'Salvo offline com sucesso.',
          data: { id: error.offlineId }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config,
      });
    }

    // FASE 2: Trata 401 — MAS NUNCA para /v1/user (o AuthContext é o dono dessa rota)
    // Para todas as outras rotas: se 401 e online, limpa tudo e redireciona.
    const requestUrl = error.config?.url || '';
    const isUserRoute = requestUrl.includes('/v1/user') || requestUrl.endsWith('/user');
    
    if (error.response?.status === 401 && navigator.onLine && !isUserRoute) {
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

