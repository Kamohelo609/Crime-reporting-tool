import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const KEY_USER = 'sc_user'
const KEY_TOKEN = 'sc_token'

const demoOfficer = {
  id: 'O-4021',
  fullName: 'J. Doe',
  badge: '#4021',
  email: 'j.doe@precinct12.gov',
  role: 'officer'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY_USER)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const setSession = (session) => {
    const nextUser = session?.user ?? null
    setUser(nextUser)
    if (nextUser) {
      localStorage.setItem(KEY_USER, JSON.stringify(nextUser))
      localStorage.setItem(KEY_TOKEN, session.token || '')
    } else {
      localStorage.removeItem(KEY_USER)
      localStorage.removeItem(KEY_TOKEN)
    }
  }

  const login = (session) => setSession(session)

  const enterDemoDispatch = () => {
    setSession({ user: demoOfficer, token: 'demo-officer-token' })
  }

  const logout = () => {
    setSession(null)
  }

  const isOfficer = user?.role === 'officer'

  return (
    <AuthContext.Provider value={{ user, login, logout, isOfficer, enterDemoDispatch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}