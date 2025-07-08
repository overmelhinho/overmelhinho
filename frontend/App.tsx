import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import AdminPage from "@/pages/AdminPage";
import EditarUsuarioPage from "@/pages/EditarUsuarioPage";
import PrivateRoute from "@/routes/PrivateRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Login público */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rota protegida: usuário autenticado */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* Rota protegida: só admin */}
        <Route element={<PrivateRoute requiredRole="admin" />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        {/* Rota protegida: só quem pode editar usuários */}
        <Route element={<PrivateRoute requiredPermission="edit users" />}>
          <Route path="/usuarios/editar" element={<EditarUsuarioPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
