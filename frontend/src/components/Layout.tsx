import { ArrowLeftRight, LayoutDashboard, LogOut, Tags } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useLogout, useUsuario } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const LINKS = [
  { to: '/', rotulo: 'Dashboard', icone: LayoutDashboard, end: true },
  { to: '/transacoes', rotulo: 'Transações', icone: ArrowLeftRight, end: false },
  { to: '/categorias', rotulo: 'Categorias', icone: Tags, end: false },
]

export function Layout() {
  const { data: usuario } = useUsuario()
  const logout = useLogout()
  const navigate = useNavigate()

  const sair = () => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) })

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          {/* Espaço reservado para logo/mascote (fora do escopo da IA). */}
          <span className="text-lg font-bold tracking-tight text-primary">JáNaCaixa</span>
          <nav className="hidden flex-1 items-center gap-1 sm:flex" aria-label="Principal">
            {LINKS.map(({ to, rotulo, icone: Icone, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                    isActive && 'bg-secondary text-foreground',
                  )
                }
              >
                <Icone className="size-4" aria-hidden="true" />
                {rotulo}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">{usuario?.username}</span>
            <Button variant="ghost" size="sm" onClick={sair} loading={logout.isPending}>
              {!logout.isPending && <LogOut aria-hidden="true" />}
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:pb-10">
        <Outlet />
      </main>

      {/* Navegação inferior no celular (responsivo a partir de 375 px). */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t bg-card sm:hidden"
        aria-label="Navegação móvel"
      >
        {LINKS.map(({ to, rotulo, icone: Icone, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2 text-xs text-muted-foreground',
                isActive && 'text-primary',
              )
            }
          >
            <Icone className="size-5" aria-hidden="true" />
            {rotulo}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
