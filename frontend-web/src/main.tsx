import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,        // datos frescos 5 min → 0 refetches al navegar entre páginas
      gcTime: 10 * 60 * 1000,           // mantiene en memoria 10 min tras desmontar el componente
      refetchOnWindowFocus: false,       // no refetch al volver a la pestaña
      refetchOnReconnect: true,          // sí refetch si se recupera la conexión
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster position="top-right" />
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
)
