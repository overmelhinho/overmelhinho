import { createContext, useContext, useEffect, useState } from 'react'
import api from '@/lib/axios'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  const login = async (credentials) => {
    const { data } = await api.post('/login', credentials)
    const token = data.token

    localStorage.setItem('token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    await fetchUser()
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch (error) {
      console.warn("Falha ao fazer logout no servidor:", error)
    }
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/user')
      setUser(data)
    } catch {
      // Evita loop de erro chamando logout em token inválido
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      setUser(null)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && !user) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => useContext(AuthContext)
