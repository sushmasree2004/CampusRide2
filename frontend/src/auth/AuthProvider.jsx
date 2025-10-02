import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('campusride_token')
    if(!token) { setLoading(false); return }
    // fetch profile (assumes backend has GET /users/me)
    api.get('/users/me').then(res => {
      setUser(res.data)
    }).catch(() => {
      localStorage.removeItem('campusride_token')
    }).finally(()=> setLoading(false))
  }, [])

  const logout = () => {
    localStorage.removeItem('campusride_token')
    setUser(null)
  }

  return <AuthContext.Provider value={{user, setUser, loading, logout}}>
    {children}
  </AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
