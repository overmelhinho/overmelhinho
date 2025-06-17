import { createBrowserRouter } from 'react-router-dom'
import AuthLayout from '@/layouts/AuthLayout'
import GuestLayout from '@/layouts/GuestLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import RelatoriosAdmin from '@/pages/RelatoriosAdmin'
import VerifyCodePage from '@/pages/VerifyCodePage'
import ProtectedRoute from './ProtectedRoute'
import { AuthProvider } from '@/contexts/AuthContext'
import LeadForm from '@/components/LeadForm' // ✅ importação nova

export const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <GuestLayout />
      </AuthProvider>
    ),
    children: [
      {
        path: '/login',
        element: <Login />
      },
      {
        path: '/lead-form', // ✅ nova rota pública
        element: <LeadForm />
      }
    ]
  },
  {
    element: (
      <AuthProvider>
        <AuthLayout />
      </AuthProvider>
    ),
    children: [
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )
      },
      {
        path: '/admin/relatorios',
        element: (
          <ProtectedRoute requiredRole="admin">
            <RelatoriosAdmin />
          </ProtectedRoute>
        )
      },
      {
        path: '/verify-code',
        element: <VerifyCodePage />
      }
    ]
  }
])
