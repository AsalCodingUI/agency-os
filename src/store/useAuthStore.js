import { create } from 'zustand'

// Pastikan ada kata "export const" di sini!
export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ isLoading: loading }),

  clearAuth: () => set({ user: null, session: null })
}))