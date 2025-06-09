import { createBrowserRouter } from 'react-router-dom'
import AuthLayout from '@/layouts/AuthLayout'
import GuestLayout from '@/layouts/GuestLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'

export const router = createBrowserRouter([
  {
    element: <GuestLayout />,
    children: [
      {
        path: '/login',
        element: <Login />
      }
    ]
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/',
        element: <Dashboard />
      }
    ]
  }
])
