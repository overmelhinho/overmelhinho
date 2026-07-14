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
      const isNetworkError = !err.response; // sem response = offline / timeout

      if (isNetworkError) {
        // Erro de rede — tenta usar cache para não deslogar offline
        const cached = localStorage.getItem('ov_cached_user');
        if (cached && localStorage.getItem('token')) {
          try {
            setUser(JSON.parse(cached));
            setIsLoading(false);
            return;
          } catch {}
        }
      }

      // 401 ou sem cache: desloga de verdade
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
    // TODO Fase 3: clearIndexedDB() aqui quando IndexedDB for implementado
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
