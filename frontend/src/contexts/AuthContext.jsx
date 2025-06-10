import React, { createContext, useContext, useState } from "react";
import api from "@/services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState(null);

  const login = async (email, password) => {
    try {
      setAuthLoading(true);
      const response = await api.post("/login", { email, password });

      // Armazena e-mail para o passo seguinte (verificação)
      setLoginEmail(email);

      return response.data;
    } catch (error) {
      console.error("Erro ao fazer login:", error.response?.data || error.message);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const verifyAndLogin = async (code) => {
    try {
      const response = await api.post("/verify-login", {
        email: loginEmail,
        code,
      });

      const { token, user } = response.data;
      setToken(token);
      setUser(user);
      localStorage.setItem("token", token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      return response.data;
    } catch (error) {
      console.error("Erro ao verificar código:", error.response?.data || error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post("/logout", {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
    } catch (error) {
      console.error("Erro ao fazer logout:", error.response?.data || error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authLoading,
        login,
        verifyAndLogin,
        logout,
        loginEmail,
        setUser,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
