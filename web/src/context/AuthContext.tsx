import React, { createContext, useContext, useState, useEffect } from 'react'
import { userService } from '../services/supabase'

interface User {
  id: string
  email: string
  phone_number: string
  first_name: string
  last_name: string
}

interface Wallet {
  id: string
  account_number: string
  balance: number
}

interface AuthContextType {
  user: User | null
  wallet: Wallet | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  register: (email: string, phone: string, firstName: string, lastName: string, pin: string) => Promise<void>
  login: (email: string, pin: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken')
    if (savedToken) {
      setToken(savedToken)
    }
  }, [])

  const register = async (email: string, phone: string, firstName: string, lastName: string, pin: string) => {
    setIsLoading(true)
    try {
      const response = await userService.register(email, phone, firstName, lastName, pin)
      if (response.status === 'success') {
        setUser(response.data.user)
        setWallet(response.data.wallet)
        setToken(response.data.token)
        localStorage.setItem('authToken', response.data.token)
      } else {
        throw new Error(response.error || 'Registration failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, pin: string) => {
    setIsLoading(true)
    try {
      const response = await userService.login(email, pin)
      if (response.status === 'success') {
        setUser(response.data.user)
        setWallet(response.data.wallet)
        setToken(response.data.token)
        localStorage.setItem('authToken', response.data.token)
      } else {
        throw new Error(response.error || 'Login failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setWallet(null)
    setToken(null)
    localStorage.removeItem('authToken')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        token,
        isLoading,
        isAuthenticated: !!token,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}


