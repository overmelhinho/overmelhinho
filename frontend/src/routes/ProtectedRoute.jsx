import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user } = useAuthContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    if (user.two_factor_verified === false) {
      navigate('/verify-code')
    } else if (requiredRole && user.role !== requiredRole) {
      navigate('/') // ou /acesso-negado
    }
  }, [user, requiredRole, navigate])

  if (
    !user ||
    user.two_factor_verified === false ||
    (requiredRole && user.role !== requiredRole)
  ) {
    return null
  }

  return children
}
