// "Para onde foi o dinheiro": treemap das despesas por categoria + 5 maiores (ADR-014).
import type { ResumoCategoria } from '@/api/types'
import { formatarMoeda, nomeDoMes } from '@/lib/format'
import { squarify, textoSobre } from '@/lib/graficos'
import { SecaoPainel, TabelaOculta } from './partes'

const pct = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

interface Props {
  /** Totais por categoria vindos do backend; aqui só se calculam proporções. */
  categorias: ResumoCategoria[]
  despesas: string
  mes: string
  progresso: number
  compacto: boolean
}

export function CategoriasTreemap({ categorias, despesas, mes, progresso, compacto }: Props) {
  const total = Number(despesas)
  const itens = categorias
    .filter((c) => c.tipo === 'DESPESA')
    .map((c) => ({ ...c, v: Number(c.total), pct: `${pct.format(total > 0 ? (Number(c.total) / total) * 100 : 0)}%` }))
    .sort((a, b) => b.v - a.v)
  const W = compacto ? 130 : 160
  const H = 100
  const [pxW, pxH] = compacto ? [311, 240] : [410, 260]
  const blocos = squarify(itens, W, H)
  const nome = nomeDoMes(mes)
  const maior = itens[0]

  return (
    <SecaoPainel
      id="t-mapa"
      titulo="Para onde foi o dinheiro"
      extra={<span className="text-[13px] font-medium text-texto-2">Despesas por categoria</span>}
      className="flex h-full flex-col"
    >
      {itens.length === 0 ? (
        <p className="m-0 py-10 text-center text-sm font-medium text-texto-2">Nenhuma despesa neste mês.</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          <div
            role="img"
            aria-label={`Mapa de árvore das despesas de ${nome} por categoria. Maior: ${maior.nome}, ${formatarMoeda(maior.total)} (${maior.pct}).`}
            className="relative overflow-hidden rounded-campo"
            style={{ height: compacto ? 240 : 260 }}
          >
            {blocos.map((b) => {
              const bw = (b.w / W) * pxW
              const bh = (b.h / H) * pxH
              return (
                <div
                  key={b.categoria_id}
                  aria-hidden="true"
                  className="absolute p-0.5"
                  style={{ left: `${(b.x / W) * 100}%`, top: `${(b.y / H) * 100}%`, width: `${(b.w / W) * 100}%`, height: `${(b.h / H) * 100}%` }}
                >
                  <div
                    className="flex size-full flex-col gap-0.5 overflow-hidden rounded-lg px-2.5 py-2"
                    style={{ background: b.cor, color: textoSobre(b.cor), opacity: Math.min(1, progresso * 1.4) }}
                  >
                    {bw > 64 && bh > 30 && <span className="text-[13px] leading-tight font-bold">{b.nome}</span>}
                    {bw > 96 && bh > 72 && (
                      <>
                        <span className="text-sm leading-tight font-extrabold whitespace-nowrap">{formatarMoeda(b.total)}</span>
                        <span className="text-xs leading-tight font-semibold">{b.pct}</span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex flex-col text-sm">
            <div aria-hidden="true" className="pb-1.5 text-[13px] font-bold text-texto-2">
              5 maiores categorias
            </div>
            <table aria-label="5 maiores categorias de despesa" className="w-full border-collapse">
              <thead>
                <tr className="text-xs font-semibold text-texto-2">
                  <th scope="col" className="py-1.5 text-left font-semibold">
                    Categoria
                  </th>
                  <th scope="col" className="py-1.5 text-right font-semibold">
                    Valor
                  </th>
                  <th scope="col" className="w-16 py-1.5 text-right font-semibold">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {itens.slice(0, 5).map((c) => (
                  <tr key={c.categoria_id} className="border-t border-divisor">
                    <th scope="row" className="max-w-0 py-[9px] text-left font-semibold">
                      <span className="flex min-w-0 items-center gap-2">
                        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: c.cor }} />
                        <span className="truncate">{c.nome}</span>
                      </span>
                    </th>
                    <td className="py-[9px] pl-3 text-right font-bold whitespace-nowrap">{formatarMoeda(c.total)}</td>
                    <td className="py-[9px] pl-3 text-right font-semibold text-texto-2">{c.pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TabelaOculta
            rotulo={`Todas as despesas por categoria em ${nome}`}
            colunas={['Categoria', 'Valor', 'Percentual']}
            linhas={itens.map((c) => [c.nome, formatarMoeda(c.total), c.pct])}
          />
        </div>
      )}
    </SecaoPainel>
  )
}
