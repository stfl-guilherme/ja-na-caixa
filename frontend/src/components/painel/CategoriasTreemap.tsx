// "Para onde foi o dinheiro": treemap das despesas por categoria + tabela das maiores (ADR-014, ADR-019).
import { useState } from 'react'
import type { ResumoCategoria } from '@/api/types'
import { formatarMoeda, nomeDoMes } from '@/lib/format'
import { moverComSetas, squarify, textoSobre } from '@/lib/graficos'
import { cn } from '@/lib/utils'
import { CartaoGrafico, Dica, TabelaOculta } from './partes'

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
  const [indice, setIndice] = useState<number | null>(null)
  const total = Number(despesas)
  const itens = categorias
    .filter((c) => c.tipo === 'DESPESA')
    .map((c) => ({ ...c, v: Number(c.total), pct: `${pct.format(total > 0 ? (Number(c.total) / total) * 100 : 0)}%` }))
    .sort((a, b) => b.v - a.v)
  const W = compacto ? 130 : 150
  const H = 100
  const altura = compacto ? 240 : 320
  const [pxW, pxH] = compacto ? [311, 240] : [560, 320]
  const blocos = squarify(itens, W, H)
  const nome = nomeDoMes(mes)

  if (itens.length === 0) {
    return (
      <CartaoGrafico>
        <p className="m-0 py-10 text-center text-sm font-medium text-texto-2">Nenhuma despesa neste mês.</p>
      </CartaoGrafico>
    )
  }

  const maior = itens[0]
  const escolhido = indice !== null ? blocos[indice] : null

  return (
    <CartaoGrafico>
      <div className={cn('grid gap-6', !compacto && 'grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start')}>
        <div className="relative" style={{ height: altura }}>
          <div className="absolute inset-0 overflow-hidden rounded-campo">
            {blocos.map((b, i) => {
              const bw = (b.w / W) * pxW
              const bh = (b.h / H) * pxH
              return (
                <div
                  key={b.categoria_id}
                  aria-hidden="true"
                  onMouseEnter={() => setIndice(i)}
                  onMouseLeave={() => setIndice(null)}
                  className="absolute p-0.5"
                  style={{ left: `${(b.x / W) * 100}%`, top: `${(b.y / H) * 100}%`, width: `${(b.w / W) * 100}%`, height: `${(b.h / H) * 100}%` }}
                >
                  <div
                    className={cn('flex size-full flex-col gap-0.5 overflow-hidden rounded-lg px-2.5 py-2', indice === i && 'outline-3 -outline-offset-3 outline-tinta')}
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
          {/* Camada só para teclado: os blocos já respondem ao mouse. */}
          <div
            tabIndex={0}
            role="img"
            aria-label={`Mapa de árvore das despesas de ${nome} por categoria. Maior: ${maior.nome}, ${formatarMoeda(maior.total)} (${maior.pct}). Use as setas para ver cada categoria.`}
            onFocus={() => setIndice(0)}
            onBlur={() => setIndice(null)}
            onKeyDown={(e) => moverComSetas(e, indice, blocos.length, setIndice)}
            className="pointer-events-none absolute inset-0 rounded-campo focus-visible:pointer-events-auto"
          />
          {escolhido && (
            <Dica esquerda={((escolhido.x + escolhido.w / 2) / W) * 100} topo={(escolhido.y / H) * 100 + 8}>
              <div>{escolhido.nome}</div>
              <div className="text-sm font-extrabold">
                {formatarMoeda(escolhido.total)} · {escolhido.pct}
              </div>
            </Dica>
          )}
        </div>
        <div className="flex flex-col text-sm">
          <table aria-label="Maiores categorias de despesa" className="w-full border-collapse">
            <thead>
              <tr className="text-xs font-semibold text-texto-2">
                <th scope="col" className="py-1.5 text-left font-semibold">
                  Categoria
                </th>
                <th scope="col" className="py-1.5 text-right font-semibold">
                  Valor (R$)
                </th>
                <th scope="col" className="w-16 py-1.5 text-right font-semibold">
                  % do mês
                </th>
              </tr>
            </thead>
            <tbody>
              {itens.slice(0, 6).map((c) => (
                <tr key={c.categoria_id} className="border-t border-divisor">
                  <th scope="row" className="max-w-0 py-[11px] text-left font-semibold">
                    <span className="flex min-w-0 items-center gap-2">
                      <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: c.cor }} />
                      <span className="truncate">{c.nome}</span>
                    </span>
                  </th>
                  <td className="py-[11px] pl-3 text-right font-bold whitespace-nowrap">{formatarMoeda(c.total)}</td>
                  <td className="py-[11px] pl-3 text-right font-semibold text-texto-2">{c.pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <TabelaOculta
        rotulo={`Todas as despesas por categoria em ${nome}`}
        colunas={['Categoria', 'Valor', 'Percentual']}
        linhas={itens.map((c) => [c.nome, formatarMoeda(c.total), c.pct])}
      />
    </CartaoGrafico>
  )
}
