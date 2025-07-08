import { createBrowserRouter } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";


const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: <DashboardPage />,
  },
  {
    path: "*",
    element: <div className="p-10 text-center text-xl text-red-500">Página não encontrada</div>,
  },

{ path: "/forgot-password", element: <ForgotPasswordPage /> },

{ path: "/reset-password/:token", element: <ResetPasswordPage /> },


]);

export default router;
