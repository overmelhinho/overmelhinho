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
  setUser: (user: UserType | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => { },
  fetchUser: async () => { },
  logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);

  // Instância do Echo para ouvir sockets realtime
  const [echoInstance, setEchoInstance] = useState<any>(null);

  // Busca dados do usuário logado, incluindo roles/perms
  async function fetchUser() {
    console.log("CHAMOU fetchUser!");
    try {
      const { data } = await api.get("/v1/user");
      console.log("RESPOSTA DO /v1/user:", data);
      setUser(data);
    } catch (err) {
      console.log("ERRO ao buscar /v1/user:", err);
      setUser(null);
      localStorage.removeItem("token");
      if (echoInstance) {
        echoInstance.disconnect();
        setEchoInstance(null);
      }
    }
  }

  // Logout global
  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    if (echoInstance) {
      echoInstance.disconnect();
      setEchoInstance(null);
    }
  }

  // Ao carregar, se houver token, busca user
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) fetchUser();
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
              console.log("NOVA NOTIFICAÇÃO REALTIME RECEBIDA: ", notification);
              // Aqui vamos disparar um evento customizado no windows ou gerenciar toast!
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
    <AuthContext.Provider value={{ user, setUser, fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para facilitar uso
export function useAuth() {
  return useContext(AuthContext);
}
