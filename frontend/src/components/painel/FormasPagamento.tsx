// Seção "Como você pagou" do Painel (spec 17.3): barras horizontais por forma de pagamento.
import type { Resumo } from '@/api/types'
import { formatarMoeda, nomeDoMes } from '@/lib/format'
import { formaPagamento } from '@/lib/formasPagamento'
import { cn } from '@/lib/utils'

export function FormasPagamento({ formas, mes }: { formas: Resumo['despesas_por_forma']; mes: string }) {
  return (
    <div className="rounded-cartao bg-branco px-[22px] py-5 shadow-cartao">
      {formas.length === 0 ? (
        <p className="m-0 text-sm font-medium text-texto-2">Nenhuma despesa em {nomeDoMes(mes)}.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {formas.map((item) => {
            const { Icone } = formaPagamento(item.forma)
            const naoInformado = item.forma === 'NAO_INFORMADO'
            // Percentual da fatia é exibição: o total em reais vem do backend (ADR-005).
            const percentual = Math.round(Number(item.percentual))
            return (
              <li key={item.forma} className="flex flex-col gap-1.5">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className={cn('flex items-center gap-2 text-sm font-bold', naoInformado && 'text-texto-2')}>
                    <Icone className="size-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
                    {item.rotulo}
                  </span>
                  <span className="text-[13px] font-semibold text-texto-3">
                    {formatarMoeda(item.total)} · {percentual}%
                  </span>
                </span>
                <span aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-segmentado-bg">
                  <span
                    className={cn('block h-full rounded-full', naoInformado ? 'bg-texto-2' : 'bg-despesa-grafico')}
                    style={{ width: `${Math.min(100, Number(item.percentual))}%` }}
                  />
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
