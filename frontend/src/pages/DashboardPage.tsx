import { useEffect, useState } from "react";
import axios from "@/services/api";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";

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
    } catch {}
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!user) return <p className="text-center mt-10">Carregando...</p>;

  return (
    <Layout>
      <div className="bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Bem-vindo, {user.name}!</h1>
        <p className="text-gray-600 mb-4">Você está logado como <strong>{user.roles.join(", ")}</strong>.</p>

        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Sair
        </button>
      </div>
    </Layout>
  );
}
