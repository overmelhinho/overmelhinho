import { useEffect, useState } from "react";
import axios from "@/services/api";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get("/v1/user");
        setUser(data);
      } catch (err) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post("/v1/logout");
    } catch (err) {
      // Ignora erro de logout
    } finally {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  if (!user) return <p className="text-center mt-10">Carregando...</p>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Bem-vindo, {user.name}!</h1>
      <p className="mb-6 text-gray-700">Você está logado com sucesso.</p>
      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
      >
        Sair
      </button>
    </div>
  );
}
