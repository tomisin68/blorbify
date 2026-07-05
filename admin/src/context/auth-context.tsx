import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { isAllowedAdmin } from '@/lib/config'

type AuthContextValue = {
  user: User | null
  loading: boolean
  error: string | null
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !isAllowedAdmin(firebaseUser.email)) {
        setError('This account is not authorized to access the admin console.')
        await signOut(auth)
        setUser(null)
      } else {
        setError(null)
        setUser(firebaseUser)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signInWithEmail(email: string, password: string) {
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      setError('Invalid email or password.')
      throw new Error('sign-in-failed')
    }
  }

  async function signInWithGoogle() {
    setError(null)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch {
      setError('Google sign-in failed.')
      throw new Error('sign-in-failed')
    }
  }

  async function logout() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithEmail, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
