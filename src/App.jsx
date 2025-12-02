import { useEffect } from "react"
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom"
import { supabase } from "./lib/supabase"
import { useAuthStore } from "./store/useAuthStore"

// Import Components
import DashboardLayout from "./components/DashboardLayout"
import AgencyOS from "./components/AgencyOS" // Calculator
import Team from "./pages/Team"
import Attendance from "./pages/Attendance"
import Leave from "./pages/Leave"
import Payroll from "./pages/Payroll"
import Login from "./pages/Login"

// --- ROOT REDIRECT COMPONENT ---
const RootRedirect = () => {
  const { isLoading, isStakeholder, isProjectManager, isRestrictedEmployee } = useAuthStore()

  if (isLoading) return null // Or a spinner

  if (isRestrictedEmployee) {
    return <Navigate to="/attendance" replace />
  }

  if (isStakeholder || isProjectManager) {
    return <AgencyOS />
  }

  // Fallback
  return <Navigate to="/attendance" replace />
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser, fetchProfile } = useAuthStore()

  // Cek Status Login saat aplikasi dibuka
  useEffect(() => {
    // 1. Cek sesi yang ada sekarang
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user?.email) {
        fetchProfile(session.user.email)
      }

      // Jika tidak ada session & bukan di halaman login, tendang ke login
      if (!session && location.pathname !== "/login") {
        navigate("/login")
      }
    })

    // 2. Dengarkan perubahan auth (Login/Logout realtime)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user?.email) {
        fetchProfile(session.user.email)
      }
      if (!session) navigate("/login")
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected Routes wrapped in DashboardLayout */}
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/tools" element={<AgencyOS />} />
        <Route path="/team" element={<Team />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/leave" element={<Leave />} />
        <Route path="/payroll" element={<Payroll />} />
      </Route>
    </Routes>
  )
}

export default App