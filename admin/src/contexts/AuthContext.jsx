import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      try {
        // Verify token is still valid
        const response = await authService.me()
        if (response.success) {
          setUser(response.data)
          setIsAuthenticated(true)
        } else {
          logout()
        }
      } catch (error) {
        logout()
      }
    }
    setLoading(false)
  }

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password)
      
      if (response.success) {
        localStorage.setItem('auth_token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        setUser(response.data.user)
        setIsAuthenticated(true)
        toast.success('Login realizado com sucesso!')
        return { success: true }
      } else {
        toast.error(response.error || 'Erro ao fazer login')
        return { success: false, error: response.error }
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao fazer login'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      // Ignore logout errors
    }
    
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
