// Barra de orçamento (spec 17.1; decisoes-de-design, seção 5): o estado também aparece em texto.
import type { Orcamento, SituacaoOrcamento } from '@/api/types'
import { formatarMoeda } from '@/lib/format'
import { percentualExibido, textoSituacao } from '@/lib/orcamento'
import { cn } from '@/lib/utils'

/** A cor da barra indica o estado; a cor da categoria fica só no marcador (decisoes-de-design, seção 5). */
const CLASSE_DA_SITUACAO: Record<SituacaoOrcamento, string> = {
  ok: 'bg-estado-sucesso',
  atencao: 'bg-estado-atencao',
  estourado: 'bg-estado-erro',
}

interface BarraOrcamentoProps {
  orcamento: Orcamento
  /** Mostra o nome da categoria acima da barra (no Painel); no cartão da categoria, o nome já está no título. */
  comNome?: boolean
  className?: string
}

export function BarraOrcamento({ orcamento, comNome = false, className }: BarraOrcamentoProps) {
  const percentual = percentualExibido(orcamento.percentual)
  const valores = `${formatarMoeda(orcamento.gasto)} de ${formatarMoeda(orcamento.limite)} (${percentual}%)`
  const estado = textoSituacao(orcamento)
  return (
    <div data-testid="barra-orcamento" className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        {comNome && (
          <span className="flex min-w-0 items-center gap-2 text-sm font-bold">
            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: orcamento.cor }} />
            <span className="truncate">{orcamento.nome}</span>
          </span>
        )}
        <span className="text-[13px] font-semibold text-texto-3">{valores}</span>
      </div>
      <div
        role="progressbar"
        aria-label={`Orçamento de ${orcamento.nome}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, percentual)}
        aria-valuetext={`${valores}. ${estado}.`}
        className="h-2.5 overflow-hidden rounded-full bg-segmentado-bg"
      >
        <div
          data-testid="preenchimento"
          className={cn('h-full rounded-full', CLASSE_DA_SITUACAO[orcamento.situacao])}
          style={{ width: `${Math.min(100, percentual)}%` }}
        />
      </div>
      <span
        data-situacao={orcamento.situacao}
        className={cn(
          'text-[13px] font-bold',
          orcamento.situacao === 'ok' && 'text-receita',
          orcamento.situacao === 'estourado' && 'text-despesa',
        )}
        style={orcamento.situacao === 'atencao' ? { color: 'var(--jnc-cat-mostarda)' } : undefined}
      >
        {estado}
      </span>
    </div>
  )
}
