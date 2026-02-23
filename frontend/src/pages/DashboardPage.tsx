import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
// @ts-expect-error jsx component
import DashboardDiretoria from "./dashboard/DashboardDiretoria";
// @ts-expect-error jsx component
import DashboardAdmin from "./dashboard/DashboardAdmin";
// @ts-expect-error jsx component
import DashboardDefault from "./dashboard/DashboardDefault";
import FocusDashboard from "./dashboard/FocusDashboard";
import { Loader } from "lucide-react";
import axios from "@/services/api";
import { useNavigate } from "react-router-dom";

type User = {
  id: number;
  name: string;
  roles: string[];
  [key: string]: any; // outros campos se precisar
};

const dashboards: Record<string, React.FC<{ user: User }>> = {
  admin: DashboardAdmin,
  administrador: DashboardAdmin,
  diretoria: DashboardDiretoria,
  diretor: DashboardDiretoria,
  comercial: FocusDashboard,
  marketing: FocusDashboard,
  operacional: FocusDashboard,
  default: DashboardDefault,
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get("/v1/user");
        setUser(data);
      } catch (err) {
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading || !user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader className="animate-spin text-primary w-12 h-12" />
        </div>
      </Layout>
    );
  }

  // Padronize a role para comparar sem acento/minúscula
  const roleKey = (user.roles?.[0] || "default")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  console.log("roles do usuário:", user.roles, "| roleKey:", roleKey);

  const DashboardComponent = dashboards[roleKey] || dashboards.default;

  return (
    <Layout>
      <DashboardComponent user={user} />
    </Layout>
  );
}
