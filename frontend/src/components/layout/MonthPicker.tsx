import { ChevronLeft, ChevronRight } from 'lucide-react'
import { botaoIcone } from '@/components/ui/botao'
import { useMesSelecionado } from '@/hooks/useMesSelecionado'
import { deslocarMes, formatarMesRotulo } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Seletor de mês global (ADR-016): o mês vale para todas as telas internas. */
export function MonthPicker({ className }: { className?: string }) {
  const { mes, setMes } = useMesSelecionado()
  return (
    <div
      role="group"
      aria-label="Mês de referência"
      className={cn('flex items-center gap-0.5 rounded-campo border border-borda-sutil bg-branco p-0.5', className)}
    >
      <button type="button" className={cn(botaoIcone, 'text-tinta')} onClick={() => setMes(deslocarMes(mes, -1))} aria-label="Mês anterior">
        <ChevronLeft strokeWidth={2.5} aria-hidden="true" />
      </button>
      <span aria-live="polite" className="min-w-[150px] flex-1 text-center text-[15px] font-bold">
        {formatarMesRotulo(mes)}
      </span>
      <button type="button" className={cn(botaoIcone, 'text-tinta')} onClick={() => setMes(deslocarMes(mes, 1))} aria-label="Próximo mês">
        <ChevronRight strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  )
}
