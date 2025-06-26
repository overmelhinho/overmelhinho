import { createBrowserRouter } from 'react-router-dom'
import AuthLayout from '@/layouts/AuthLayout'
import GuestLayout from '@/layouts/GuestLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import RelatoriosAdmin from '@/pages/RelatoriosAdmin'
import VerifyCodePage from '@/pages/VerifyCodePage'
import ProtectedRoute from './ProtectedRoute'
import { AuthProvider } from '@/contexts/AuthContext'

// Páginas novas por função
import LeadForm from '@/components/LeadForm'
import LeadsList from '@/pages/LeadsList'
import IAFeaturePage from '@/pages/IAFeaturePage'
import ComercialKpisPage from '@/pages/ComercialKpisPage'
import ValidacoesPage from '@/pages/ValidacoesPage'
import CriativoDashboard from '@/pages/CriativoDashboard'

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
        path: '/lead-form',
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
        path: '/verify-code',
        element: <VerifyCodePage />
      },

      // Diretoria Comercial
      {
        path: '/comercial-diretoria',
        element: (
          <ProtectedRoute requiredRole="diretora">
            <ComercialKpisPage />
          </ProtectedRoute>
        )
      },

      // Time Comercial
      {
        path: '/leads',
        element: (
          <ProtectedRoute requiredRole="comercial">
            <LeadsList />
          </ProtectedRoute>
        )
      },

      // Administrativo
      {
        path: '/admin/relatorios',
        element: (
          <ProtectedRoute requiredRole="admin">
            <RelatoriosAdmin />
          </ProtectedRoute>
        )
      },
      {
        path: '/validacoes',
        element: (
          <ProtectedRoute requiredRole="admin">
            <ValidacoesPage />
          </ProtectedRoute>
        )
      },

      // Time Criativo
      {
        path: '/criativo',
        element: (
          <ProtectedRoute requiredRole="criativo">
            <CriativoDashboard />
          </ProtectedRoute>
        )
      },

      // IA e Automatizações
      {
        path: '/ia',
        element: (
          <ProtectedRoute requiredRole="admin">
            <IAFeaturePage />
          </ProtectedRoute>
        )
      }
    ]
  }
])
