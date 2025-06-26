import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/services/api";
import { useAuthContext } from "@/contexts/AuthContext";

const VerifyCodePage = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
      setError("");
      const response = await api.post("/verify-login", { email, code });
      setToken(response.data.token);
      setUser(response.data.user);
      localStorage.setItem("token", response.data.token);
      navigate("/");
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      setError("Código inválido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-6">
          <img
            src="/logo-vermelhinho.png"
            alt="Logo O Vermelhinho"
            className="mx-auto w-24 mb-2"
          />
          <h1 className="text-2xl font-bold text-red-600">Verifique seu código</h1>
          <p className="text-sm text-gray-500 mt-1">Enviado para: {email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Código</label>
            <input
              type="text"
              maxLength={6}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none tracking-widest text-center text-lg"
              placeholder="_ _ _ _ _ _"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Verificar"}
          </button>

          {error && (
            <p className="text-sm text-red-500 text-center mt-2">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default VerifyCodePage;
