import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // 👈 1. Buat Pindah Halaman
import { QueryClient, QueryClientProvider } from '@tanstack/react-query' // 👈 2. Buat Data Fetching
import { Provider } from "@/components/ui/provider" // 👈 3. UI Chakra (Tetap Pake yg ini)
import App from './App.jsx'

// Bikin "Otak" Query Client sekali aja
const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Urutan Pembungkus: Data -> Navigasi -> UI -> Aplikasi */}
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Provider>
          <App />
        </Provider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)