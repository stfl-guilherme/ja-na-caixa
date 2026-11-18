import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deslocarMes, formatarMes } from '@/lib/format'

export function SeletorMes({ mes, onChange }: { mes: string; onChange: (mes: string) => void }) {
  return (
    <div className="flex w-full items-center gap-1 rounded-md border bg-card p-1 sm:w-auto">
      <Button variant="ghost" size="icon" onClick={() => onChange(deslocarMes(mes, -1))} aria-label="Mês anterior">
        <ChevronLeft />
      </Button>
      <span className="min-w-32 flex-1 sm:min-w-36 sm:flex-none text-center text-sm font-medium capitalize" aria-live="polite">
        {formatarMes(mes)}
      </span>
      <Button variant="ghost" size="icon" onClick={() => onChange(deslocarMes(mes, 1))} aria-label="Próximo mês">
        <ChevronRight />
      </Button>
    </div>
  )
}
