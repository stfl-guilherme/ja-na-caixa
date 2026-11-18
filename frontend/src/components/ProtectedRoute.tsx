import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useUsuario } from '@/auth/useAuth'
import { Skeleton } from '@/components/ui/skeleton'
import { mensagemDeErro } from '@/lib/erros'

/** Sem sessão (`/auth/me` → 401) redireciona para /login (spec, seção 8). */
export function ProtectedRoute() {
  const { data: usuario, isPending, error, refetch } = useUsuario()
  const location = useLocation()

  if (isPending) {
    return (
      <div className="mx-auto grid max-w-6xl gap-4 p-6" aria-label="Carregando">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="mx-auto max-w-md p-6 text-center" role="alert">
        <p className="mb-4 text-destructive">{mensagemDeErro(error)}</p>
        <button className="text-primary underline" onClick={() => refetch()}>
          Tentar novamente
        </button>
      </div>
    )
  }
  if (!usuario) return <Navigate to="/login" replace state={{ de: location.pathname }} />
  return <Outlet />
}
