import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deslocarMes, formatarMes } from '@/lib/format'

export function SeletorMes({ mes, onChange }: { mes: string; onChange: (mes: string) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-md border bg-card p-1">
      <Button variant="ghost" size="icon" onClick={() => onChange(deslocarMes(mes, -1))} aria-label="Mês anterior">
        <ChevronLeft />
      </Button>
      <span className="min-w-36 text-center text-sm font-medium capitalize" aria-live="polite">
        {formatarMes(mes)}
      </span>
      <Button variant="ghost" size="icon" onClick={() => onChange(deslocarMes(mes, 1))} aria-label="Próximo mês">
        <ChevronRight />
      </Button>
    </div>
  )
}
