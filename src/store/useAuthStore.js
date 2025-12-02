import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// Pastikan ada kata "export const" di sini!
export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isStakeholder: false,
  isProjectManager: false,
  isRestrictedEmployee: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => {
    const isStakeholder = profile?.role === 'STAKEHOLDER';
    const isProjectManager = profile?.job_title === 'PROJECT_MANAGER';
    const isRestrictedEmployee = profile?.role === 'EMPLOYEE' && !isProjectManager;

    set({
      profile,
      isStakeholder,
      isProjectManager,
      isRestrictedEmployee
    })
  },
  setLoading: (loading) => set({ isLoading: loading }),

  fetchProfile: async (email) => {
    if (!email) return
    set({ isLoading: true })

    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email)
        .single()

      console.log("DEBUG: fetchProfile result", { email, data, error });

      if (error) throw error

      if (data) {
        const isStakeholder = data.role === 'STAKEHOLDER';
        const isProjectManager = data.job_title === 'PROJECT_MANAGER';
        const isRestrictedEmployee = data.role === 'EMPLOYEE' && !isProjectManager;

        set({
          profile: data,
          isStakeholder,
          isProjectManager,
          isRestrictedEmployee
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      set({ isLoading: false })
    }
  },

  clearAuth: () => set({
    user: null,
    session: null,
    profile: null,
    isStakeholder: false,
    isProjectManager: false,
    isRestrictedEmployee: false
  })
}))