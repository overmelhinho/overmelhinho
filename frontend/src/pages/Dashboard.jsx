import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuthContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && user.two_factor_verified === false) {
      navigate('/verify-code')
    }
  }, [user, navigate])

  if (!user || user.two_factor_verified === false) {
    return null // Ou um componente de carregamento
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Bem-vindo à Dashboard</h1>
      <p className="mt-2">Esta é a área logada da aplicação.</p>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-gray-600">Usuário: {user?.name || 'não identificado'}</span>
        <button
          onClick={logout}
          className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Sair
        </button>
      </div>
    </div>
  )
}
