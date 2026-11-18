// Navegação inferior + botão flutuante (docs/design/telas/componentes/BottomNav.dc.html), abaixo de 720px.
import { LogOut, Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useMesSelecionado } from '@/hooks/useMesSelecionado'
import { cn } from '@/lib/utils'
import { ITENS_MENU } from './itensMenu'

export function BottomNav({ onNova, onSair, saindo }: { onNova: () => void; onSair: () => void; saindo: boolean }) {
  const { comMes } = useMesSelecionado()
  const classeItem = (ativo: boolean) =>
    cn(
      'flex min-h-[52px] flex-col items-center justify-center gap-[3px] rounded-campo text-xs no-underline',
      ativo ? 'bg-verde-ativo-bg font-bold text-verde-ativo-tx' : 'font-semibold text-texto-2',
    )
  return (
    <div className="sticky bottom-0 z-40">
      <button
        type="button"
        onClick={onNova}
        aria-label="Nova transação"
        className="absolute -top-[72px] right-4 flex size-14 cursor-pointer items-center justify-center rounded-full border-0 bg-verde-700 text-branco shadow-[0_8px_20px_rgba(21,122,46,0.35)]"
      >
        <Plus className="size-6" strokeWidth={2.6} aria-hidden="true" />
      </button>
      <nav aria-label="Menu principal" className="grid h-[68px] grid-cols-4 border-t border-borda-sutil bg-branco px-2 pt-1.5 pb-2">
        {ITENS_MENU.map(({ to, rotulo, Icone, end }) => (
          <NavLink key={to} to={comMes(to)} end={end} className={({ isActive }) => classeItem(isActive)}>
            <Icone className="size-[22px]" aria-hidden="true" />
            <span>{rotulo}</span>
          </NavLink>
        ))}
        {/* O design não mostra o "Sair" no celular; sem ele não haveria como encerrar a sessão (ADR-017). */}
        <button type="button" onClick={onSair} disabled={saindo} className={cn(classeItem(false), 'cursor-pointer border-0 bg-transparent')}>
          <LogOut className="size-[22px]" aria-hidden="true" />
          <span>Sair</span>
        </button>
      </nav>
    </div>
  )
}
