import { createBrowserRouter } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import LeadsPage from "@/pages/LeadsPage";
// import ClientesPage from "@/pages/ClientesPage";
import RelatoriosPage from "@/pages/RelatoriosPage";
import CriativoPage from "@/pages/CriativoPage";
import ConfiguracoesPage from "@/pages/ConfiguracoesPage";
import UsuariosPage from "@/pages/UsuariosPage"; // NOVO IMPORT!
import Unauthorized from "@/pages/Unauthorized";
import ProtectedRoute from "./ProtectedRoute"; // seu wrapper de permissão
import MinhaContaPage from "@/pages/MinhaContaPage";

// Import de Usuários
import UserList from "@/components/User/UserList";
import UserListPage from "@/pages/UserListPage";


// Import do Dashboard
import DashboardLayout from "@/components/layout/DashboardLayout";


const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute perms={["view_dashboard"]}>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },

{
  path: "/usuarios",
  element: (
    <ProtectedRoute perms={["manage_users"]}>
	 <DashboardLayout>
          <UserListPage />
        </DashboardLayout>
    </ProtectedRoute>
  ),
},

  {
    path: "/leads",
    element: (
      <ProtectedRoute perms={["view_lead"]}>
        <LeadsPage />
      </ProtectedRoute>
    ),
  },
  // {
  //  path: "/clientes",
   //  element: (
     //  <ProtectedRoute perms={["view_client"]}>
       //  <ClientesPage />
     //  </ProtectedRoute>
   //  ),
 //  },
  {
    path: "/relatorios",
    element: (
      <ProtectedRoute perms={["view_report"]}>
        <RelatoriosPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/criativo",
    element: (
      <ProtectedRoute perms={["manage_creative"]}>
        <CriativoPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/configuracoes",
    element: (
      <ProtectedRoute perms={["manage_settings"]}>
        <ConfiguracoesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password/:token",
    element: <ResetPasswordPage />,
  },
  {
    path: "*",
    element: (
      <div className="p-10 text-center text-xl text-red-500">
        Página não encontrada
      </div>
    ),
  },
{
  path: "/minha-conta",
  element: (
    <ProtectedRoute>
      <MinhaContaPage />
    </ProtectedRoute>
  ),
},


]);

export default router;
