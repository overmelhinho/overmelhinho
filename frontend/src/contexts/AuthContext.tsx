import { createContext, useContext, useState, useEffect } from "react";
import api from '@/services/api';


type UserType = {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
};

type AuthContextType = {
  user: UserType | null;
  isLoading: boolean;
  setUser: (user: UserType | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  setUser: () => { },
  fetchUser: async () => { },
  logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  // ✅ CORRIGIDO: estado explícito de carregamento, separado de user = null
  const [isLoading, setIsLoading] = useState(true);

  // Instância do Echo para ouvir sockets realtime
  const [echoInstance, setEchoInstance] = useState<any>(null);

  // Busca dados do usuário logado, incluindo roles/perms
  async function fetchUser() {
    setIsLoading(true);

    // 🔒 FASE 2 — Se offline, usa dados em cache para manter acesso
    if (!navigator.onLine) {
      const cached = localStorage.getItem('ov_cached_user');
      if (cached && localStorage.getItem('token')) {
        try {
          setUser(JSON.parse(cached));
          setIsLoading(false);
          return;
        } catch {}
      }
      // Offline sem cache nem token → segue para o catch abaixo
    }

    try {
      const { data } = await api.get("/v1/user");
      setUser(data);
      // 🔒 FASE 2 — Salva cache do usuário para acesso offline futuro
      localStorage.setItem('ov_cached_user', JSON.stringify(data));
    } catch (err: any) {
      // 🔒 Se o erro FOR EXPLICITAMENTE 401 (Não autorizado), significa que o token expirou ou foi revogado.
      const isAuthError = err.response && (err.response.status === 401 || err.response.status === 403);

      if (!isAuthError) {
        // Para QUALQUER OUTRO ERRO (rede, timeout, erro 500, etc), tentamos manter o usuário logado usando o cache
        const cached = localStorage.getItem('ov_cached_user');
        if (cached && localStorage.getItem('token')) {
          try {
            setUser(JSON.parse(cached));
            setIsLoading(false);
            return;
          } catch {}
        }
      }

      // 401, 403 ou sem cache: desloga de verdade
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('ov_cached_user');
      if (echoInstance) {
        echoInstance.disconnect();
        setEchoInstance(null);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // 🔒 FASE 2 — Logout seguro: apaga token E todos os dados locais cacheados
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('ov_cached_user');
    // FASE 3: Limpar o cache offline do React Query guardado no IndexedDB
    import('idb-keyval').then(({ clear }) => {
      clear().catch(console.error);
    });
    setUser(null);
    setIsLoading(false);
    if (echoInstance) {
      echoInstance.disconnect();
      setEchoInstance(null);
    }
  }

  // Ao carregar, se houver token, busca user; caso contrário finaliza o loading
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Iniciar Echo dinamicamente após user carregar
  useEffect(() => {
    if (user && user.id) {
      import('@/services/echo').then(({ createEchoInstance }) => {
        const echo = createEchoInstance();
        if (echo) {
          setEchoInstance(echo);

          // Assinar canal privado do próprio usuário logado
          echo.private(`App.Models.User.${user.id}`)
            .notification((notification: any) => {
              window.dispatchEvent(new CustomEvent('app-notification', { detail: notification }));
            });

          // 📢 FASE 5: Delta Sync / WebSockets Real-time
          echo.private('clientes')
            .listen('ClienteUpdated', (e: any) => {
              // Hidratação silenciosa do cache do React Query!
              // O evento envia o cliente atualizado na propriedade 'cliente' (ou direto se ajustamos no broadcast)
              // Em nosso ClienteUpdated.php nós retornamos direto os campos no broadcastWith, 
              // mas o Laravel envolve num objeto com o nome do evento, ou não? 
              // A convenção do Echo é passar o próprio array do broadcastWith como payload.
              import('@/contexts/ReactQueryProvider').then(({ queryClient }) => {
                const cliente = e.cliente || e;
                
                // 1. Atualizar listagens Lite
                queryClient.setQueriesData({ queryKey: ['clientesLite'] }, (oldData: any) => {
                  if (!oldData || !oldData.rows) return oldData;
                  const newRows = oldData.rows.map((row: any) => 
                    row.id === cliente.id ? { ...row, ...cliente } : row
                  );
                  return { ...oldData, rows: newRows };
                });
                
                // 2. Atualizar visão de detalhes se estiver aberta
                queryClient.setQueriesData({ queryKey: ['cliente', String(cliente.id)] }, (oldData: any) => {
                  if (!oldData) return oldData;
                  return { ...oldData, ...cliente };
                });
              });
            });
        }
      });
    }

    return () => {
      if (echoInstance) {
        echoInstance.leave(`App.Models.User.${user?.id}`);
      }
    };
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para facilitar uso
export function useAuth() {
  return useContext(AuthContext);
}
