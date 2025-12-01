import { useEffect } from "react"
import { Routes, Route, useNavigate, useLocation } from "react-router-dom"
import { supabase } from "./lib/supabase"
import { useAuthStore } from "./store/useAuthStore"

// Import Halaman
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser } = useAuthStore()

  // Cek Status Login saat aplikasi dibuka
  useEffect(() => {
    // 1. Cek sesi yang ada sekarang
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)

      // Jika tidak ada session & bukan di halaman login, tendang ke login
      if (!session && location.pathname !== "/login") {
        navigate("/login")
      }
    })

    // 2. Dengarkan perubahan auth (Login/Logout realtime)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session) navigate("/login")
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* Jika url "/", tampilkan Dashboard (yang isinya AgencyOS) */}
      <Route path="/" element={<Dashboard />} />
    </Routes>
  )
}

export default App