import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import type { Tipo } from '@/api/types'
import { formatarComSinal, formatarSaldo } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Valor com sinal **e** seta: a cor nunca aparece sozinha (decisoes-de-design, princípio 5).
 * O tipo vem da categoria (ADR-004). Não faz contas.
 */
export function ValorTransacao({ valor, tipo, className }: { valor: string; tipo: Tipo; className?: string }) {
  const receita = tipo === 'RECEITA'
  const Seta = receita ? ArrowDownLeft : ArrowUpRight
  return (
    <span className={cn('inline-flex items-center gap-1 font-bold whitespace-nowrap', receita ? 'text-receita' : 'text-despesa', className)}>
      <Seta className="size-3.5 shrink-0" strokeWidth={2.6} aria-hidden="true" />
      <span>{formatarComSinal(valor, tipo)}</span>
    </span>
  )
}

/** Saldo (pode ser negativo): verde/seta de entrada se ≥ 0, coral/seta de saída se < 0. */
export function ValorSaldo({ valor, className }: { valor: string; className?: string }) {
  const negativo = valor.trim().startsWith('-')
  const Seta = negativo ? ArrowUpRight : ArrowDownLeft
  return (
    <span className={cn('inline-flex items-center gap-1 font-bold whitespace-nowrap', negativo ? 'text-despesa' : 'text-receita', className)}>
      <Seta className="size-3.5 shrink-0" strokeWidth={2.6} aria-hidden="true" />
      <span>{formatarSaldo(valor)}</span>
    </span>
  )
}
