// Menu lateral (docs/design/telas/componentes/Sidebar.dc.html).
import { LogOut, Plus } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { Espiando } from '@/components/Personagem'
import { Logo } from '@/components/Logo'
import { useMesSelecionado } from '@/hooks/useMesSelecionado'
import { cn } from '@/lib/utils'
import { ITENS_MENU } from './itensMenu'

interface AppSidebarProps {
  usuario: string
  mostrarPapo: boolean
  onNova: () => void
  onSair: () => void
  saindo: boolean
}

export function AppSidebar({ usuario, mostrarPapo, onNova, onSair, saindo }: AppSidebarProps) {
  const { comMes } = useMesSelecionado()
  return (
    <nav
      aria-label="Menu principal"
      className="sticky top-0 flex h-screen min-h-[640px] w-[248px] shrink-0 flex-col gap-6 border-r border-borda-sutil bg-branco px-5 pt-7 pb-5"
    >
      <Link to={comMes('/')} aria-label="JáNaCaixa, ir para o Painel" className="px-2 no-underline">
        <Logo className="text-[30px]" />
      </Link>
      <button
        type="button"
        onClick={onNova}
        className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-botao border-0 bg-verde-700 text-[15px] font-bold text-branco hover:brightness-110"
      >
        <Plus className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
        <span>Nova transação</span>
      </button>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {ITENS_MENU.map(({ to, rotulo, Icone, end }) => (
          <li key={to}>
            <NavLink
              to={comMes(to)}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] no-underline',
                  isActive ? 'bg-verde-ativo-bg font-bold text-verde-ativo-tx' : 'font-medium text-texto-3 hover:bg-fundo-app',
                )
              }
            >
              <Icone className="size-5" aria-hidden="true" />
              <span>{rotulo}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="flex-1" />
      <div className="pt-10">
        <Espiando pose={mostrarPapo ? 'papo-espiando' : null} altura={43} visivel={38} direita="centro" inclinar={false}>
          <div className="flex flex-col gap-2.5 rounded-2xl border border-borda-sutil bg-branco p-3.5 shadow-[0_6px_18px_rgba(20,32,40,0.06)]">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-verde-ativo-bg text-[13px] font-extrabold text-verde-ativo-tx uppercase"
              >
                {usuario.slice(0, 2)}
              </span>
              <strong className="min-w-0 truncate text-sm font-bold">{usuario}</strong>
            </div>
            <button
              type="button"
              onClick={onSair}
              disabled={saindo}
              className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-borda-sair bg-branco text-sm font-semibold text-tinta hover:bg-fundo-app disabled:opacity-55"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span>Sair</span>
            </button>
          </div>
        </Espiando>
      </div>
    </nav>
  )
}
