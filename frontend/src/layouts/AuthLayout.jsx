import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'

export default function AuthLayout() {
  const { user } = useAuthContext()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen flex">
      {/* Exemplo de estrutura para futuro layout de dashboard */}
      <aside className="w-64 bg-red-700 text-white p-4 hidden md:block">
        <h2 className="text-xl font-bold mb-4">Painel</h2>
        <nav>
          <ul className="space-y-2">
            <li><a href="/" className="hover:underline">Dashboard</a></li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 bg-gray-100 p-6">
        <Outlet />
      </main>
    </div>
  )
}
