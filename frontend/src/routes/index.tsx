// /var/www/frontend/src/routes/index.tsx
import { createBrowserRouter } from "react-router-dom";

import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";

import LeadsPage from "@/pages/LeadsPage";
import LeadsKanbanPage from "@/pages/LeadsKanbanPage";

import RelatoriosPage from "@/pages/RelatoriosPage";
import CriativoPage from "@/pages/CriativoPage";
import ConfiguracoesPage from "@/pages/ConfiguracoesPage";

import Unauthorized from "@/pages/Unauthorized";
import MinhaContaPage from "@/pages/MinhaContaPage";

import ProtectedRoute from "./ProtectedRoute";

// Layout
import DashboardLayout from "@/components/layout/DashboardLayout";

// Clientes
import ClienteCreateFromLead from "@/pages/clientes/ClienteCreateFromLead";
import ClienteEdit from "@/pages/clientes/ClienteEdit";
import ClienteCadastroForm from "@/pages/clientes/ClienteCadastroForm";
import ClientesList from "@/pages/clientes/ClientesList";

// Usuários
import UserListPage from "@/pages/UserListPage";

// Funções e Permissões
import RoleList from "@/components/Role/RoleList";
import PermissionList from "@/components/Permission/PermissionList";

// ✅ Tickets
import TicketsPage from "@/pages/TicketsPage";
import TicketDetailsPage from "@/pages/TicketDetailsPage";

// ✅ Campanhas
import CampanhasList from "@/pages/campanhas/CampanhasList";

// ✅ IMPORT CORRIGIDO (evita loop com CampanhaCreate.tsx)
import CampanhaCreate from "@/pages/campanhas/CampanhaCreate/index";

import CampanhaDetails from "@/pages/campanhas/CampanhaDetails";
import CampanhaEdit from "@/pages/campanhas/CampanhaWizard/CampanhaEditWizard";

// ✅ Vagas PRO
import JobManagerPage from "@/pages/vagas/JobManagerPage";
import JobCreatePage from "@/pages/vagas/JobCreatePage";
import JobEditPage from "@/pages/vagas/JobEditPage";
import CandidatesPage from "@/pages/vagas/CandidatesPage";
import PublicJobList from "@/pages/vagas/PublicJobList";
import PublicJobDetail from "@/pages/vagas/PublicJobDetail";

// ✅ Financeiro
import FinanceiroPage from "@/pages/financeiro/FinanceiroPage";
import PlansPage from "@/pages/financeiro/PlansPage";

// ✅ Fila de Foco
import FocusDashboard from "@/pages/dashboard/FocusDashboard";


const router = createBrowserRouter([
  { path: "/", element: <LoginPage /> },

  {
    path: "/dashboard",
    element: (
      <ProtectedRoute perms={["view_dashboard"]}>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/foco",
    element: (
      <ProtectedRoute>
        <FocusDashboard />
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
    path: "/funcoes",
    element: (
      <ProtectedRoute perms={["manage roles", "manage_roles"]}>
        <DashboardLayout>
          <RoleList />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  {
    path: "/permissoes",
    element: (
      <ProtectedRoute perms={["manage permissions", "manage_permissions"]}>
        <DashboardLayout>
          <PermissionList />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  {
    path: "/leads",
    element: (
      <ProtectedRoute perms={["view_lead"]}>
        <DashboardLayout>
          <LeadsPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  {
    path: "/leads-kanban",
    element: (
      <ProtectedRoute perms={["view_lead"]}>
        <DashboardLayout>
          <LeadsKanbanPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  // ✅ CLIENTES (LISTAGEM)
  {
    path: "/clientes",
    element: (
      <ProtectedRoute perms={["view_client"]}>
        <DashboardLayout>
          <ClientesList />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  // ✅ CLIENTES (CRIAR COM LEAD)
  {
    path: "/clientes/novo/:leadId",
    element: (
      <ProtectedRoute perms={["create_cliente"]}>
        <DashboardLayout>
          <ClienteCreateFromLead />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  // ✅ CLIENTES (CRIAR SEM LEAD)
  {
    path: "/clientes/novo",
    element: (
      <ProtectedRoute perms={["create_cliente"]}>
        <DashboardLayout>
          <ClienteCreateFromLead />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  // ✅ CLIENTES (EDITAR)
  {
    path: "/clientes/:id/editar",
    element: (
      <ProtectedRoute
        perms={[
          "view_client",
          "edit_cliente",
          "update_cliente",
          "manage_client",
          "manage_clients",
          "manage clients",
          "manage clients",
        ]}
      >
        <DashboardLayout>
          <ClienteEdit />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  // ✅ CAMPANHAS (LISTA)
  {
    path: "/campanhas",
    element: (
      <ProtectedRoute
        perms={[
          "view_campaign",
          "view_campaigns",
          "view_campanha",
          "view_campanhas",
          "manage_campaigns",
          "manage_campaign",
          "manage campanhas",
          "manage_campanhas",
        ]}
      >
        <DashboardLayout>
          <CampanhasList />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  // ✅ CAMPANHAS (CRIAR)
  {
    path: "/campanhas/nova",
    element: (
      <ProtectedRoute
        perms={[
          "create_campaign",
          "create_campaigns",
          "create_campanha",
          "create_campanhas",
          "manage_campaigns",
          "manage_campanhas",
        ]}
      >
        <DashboardLayout>
          <CampanhaCreate />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  // ✅ CAMPANHAS (DETALHE)
  {
    path: "/campanhas/:id",
    element: (
      <ProtectedRoute
        perms={[
          "view_campaign",
          "view_campaigns",
          "view_campanha",
          "view_campanhas",
          "manage_campaigns",
          "manage_campanhas",
        ]}
      >
        <DashboardLayout>
          <CampanhaDetails />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  // ✅ CAMPANHAS (EDITAR)
  {
    path: "/campanhas/:id/editar",
    element: (
      <ProtectedRoute
        perms={[
          "update_campaign",
          "edit_campaign",
          "update_campanha",
          "edit_campanha",
          "manage_campaigns",
          "manage_campanhas",
          "view_campaign",
          "view_campanha",
        ]}
      >
        <DashboardLayout>
          <CampanhaEdit />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  // ✅ TICKETS (CENTRAL)
  {
    path: "/tickets",
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <TicketsPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  // ✅ TICKETS (DETALHE)
  {
    path: "/tickets/:id",
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <TicketDetailsPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

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
    path: "/minha-conta",
    element: (
      <ProtectedRoute>
        <MinhaContaPage />
      </ProtectedRoute>
    ),
  },

  // ✅ Vagas PRO - Público (sem auth e sem layout)
  { path: "/oportunidades", element: <PublicJobList /> },
  { path: "/oportunidades/:id", element: <PublicJobDetail /> },

  { path: "/unauthorized", element: <Unauthorized /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password/:token", element: <ResetPasswordPage /> },

  // ✅ Vagas PRO - Público (sem autenticação)
  // NOTA: O site público (overmelhinho.com.br) é um frontend separado.
  // Aqui ficam apenas as rotas do painel admin (dash.overmelhinho.com.br).

  // ✅ Vagas PRO - Admin
  {
    path: "/vagas",
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <JobManagerPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/vagas/nova",
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <JobCreatePage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/vagas/:jobId/editar",
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <JobEditPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/vagas/:jobId/candidatos",
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <CandidatesPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  // ✅ Financeiro
  {
    path: "/planos",
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <PlansPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  {
    path: "/financeiro",
    element: (
      <ProtectedRoute>
        <FinanceiroPage />
      </ProtectedRoute>
    ),
  },

  // ✅ SEMPRE POR ÚLTIMO
  {
    path: "*",
    element: (
      <div className="p-10 text-center text-xl text-red-500">
        Página não encontrada
      </div>
    ),
  },
]);

export default router;
