import type { Tipo } from '@/api/types'
import { formatarMoeda } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Exibe o valor com o sinal do tipo da categoria (ADR-004). Não faz contas. */
export function ValorTransacao({ valor, tipo, className }: { valor: string; tipo: Tipo; className?: string }) {
  const despesa = tipo === 'DESPESA'
  return (
    <span className={cn('font-medium tabular-nums', despesa ? 'text-despesa' : 'text-receita', className)}>
      {formatarMoeda(despesa ? `-${valor}` : valor)}
    </span>
  )
}
