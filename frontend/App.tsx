import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import AdminPage from "@/pages/AdminPage";
import EditarUsuarioPage from "@/pages/EditarUsuarioPage";
import PrivateRoute from "@/routes/PrivateRoute";

// IMPORTS dos CRUDs:
import UserList from "@/components/User/UserList";
import RoleList from "@/components/Role/RoleList";
import PermissionList from "@/components/Permission/PermissionList";

// ✅ Clientes
import ClientesList from "@/pages/clientes/ClientesList";
import ClienteCreateFromLead from "@/pages/clientes/ClienteCreateFromLead";

console.log(RoleList, PermissionList);

function App() {
  return (
    <Router>
      <Routes>
        {/* Login público */}
        <Route path="/login" element={<LoginPage />} />

        {/* Painel principal (usuário autenticado) */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* Rota exclusiva para admin */}
        <Route element={<PrivateRoute requiredRole="admin" />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        {/* Listagem de usuários (apenas quem pode visualizar usuários) */}
        <Route element={<PrivateRoute requiredPermission="view users" />}>
          <Route path="/usuarios" element={<UserList />} />
        </Route>

        {/* Edição de usuário (quem pode editar usuários) */}
        <Route element={<PrivateRoute requiredPermission="edit users" />}>
          <Route path="/usuarios/editar" element={<EditarUsuarioPage />} />
        </Route>

        {/* ✅ CLIENTES */}
        <Route element={<PrivateRoute requiredPermission="manage clients" />}>
          {/* ✅ agora /clientes mostra a LISTAGEM */}
          <Route path="/clientes" element={<ClientesList />} />

          {/* ✅ criar cliente a partir do lead */}
          <Route path="/clientes/novo/:leadId" element={<ClienteCreateFromLead />} />
        </Route>

        <Route element={<PrivateRoute requiredPermission="manage roles" />}>
          <Route path="/funcoes" element={<RoleList />} />
        </Route>

        <Route element={<PrivateRoute requiredPermission="manage permissions" />}>
          <Route path="/permissoes" element={<PermissionList />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
