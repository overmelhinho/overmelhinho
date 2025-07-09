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
  setUser: () => {},
  fetchUser: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);

  // Busca dados do usuário logado, incluindo roles/perms
  async function fetchUser() {
    console.log("CHAMOU fetchUser!"); // <- Aqui!
    try {
      const { data } = await api.get("/v1/user");
      console.log("RESPOSTA DO /v1/user:", data); // <- Aqui!
      setUser(data);
    } catch (err) {
      console.log("ERRO ao buscar /v1/user:", err); // <- Aqui!
      setUser(null);
      localStorage.removeItem("token");
    }
  }

  // Logout global
  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  // Ao carregar, se houver token, busca user
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) fetchUser();
  }, []);

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
