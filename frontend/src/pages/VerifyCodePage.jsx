import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/services/api";
import { useAuthContext } from "@/contexts/AuthContext";

const VerifyCodePage = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setToken } = useAuthContext();

  const email = location.state?.email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      alert("Email não encontrado. Refaça o login.");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/verify-login", { email, code });
      setToken(response.data.token);
      setUser(response.data.user);
      localStorage.setItem("token", response.data.token);
      navigate("/"); // redireciona para a home
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      alert("Código inválido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Verificação de Código</h2>
      <input
        type="text"
        placeholder="Digite o código de 6 dígitos"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={6}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Verificando..." : "Verificar"}
      </button>
    </form>
  );
};

export default VerifyCodePage;
