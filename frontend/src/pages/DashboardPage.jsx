import useAuth from '../hooks/useAuth'

export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bem-vindo, {user?.name}</h1>
      <p className="mb-4">Você está logado como <strong>{user?.email}</strong>.</p>
      <button
        onClick={logout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Sair
      </button>
    </div>
  )
}
