import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = sessionStorage.getItem('gg_token')
    const storedUser = sessionStorage.getItem('gg_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = (tokenVal, userData) => {
    sessionStorage.setItem('gg_token', tokenVal)
    sessionStorage.setItem('gg_user', JSON.stringify(userData))
    setToken(tokenVal)
    setUser(userData)
  }

  const logout = () => {
    sessionStorage.removeItem('gg_token')
    sessionStorage.removeItem('gg_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
