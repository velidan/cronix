import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  username: string
  email: string
  role: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      login: (token: string, user: User) => {
        set({ 
          isAuthenticated: true, 
          user, 
          token 
        })
      },
      logout: () => {
        set({ 
          isAuthenticated: false, 
          user: null, 
          token: null 
        })
      },
    }),
    {
      name: 'cronix-auth',
    }
  )
)