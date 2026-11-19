// Textos de exibição do orçamento (spec 17.1). Valores em reais vêm prontos do backend.
import type { Orcamento } from '@/api/types'
import { formatarMoeda } from '@/lib/format'

/** Percentual exibido: inteiro truncado, coerente com a situação (79,99% → 79%). */
export function percentualExibido(percentual: string) {
  return Math.floor(Number(percentual))
}

export function textoSituacao(orcamento: Pick<Orcamento, 'situacao' | 'excesso'>) {
  if (orcamento.situacao === 'estourado') return `Limite ultrapassado em ${formatarMoeda(orcamento.excesso)}`
  if (orcamento.situacao === 'atencao') return 'Atenção'
  return 'Dentro do limite'
}
