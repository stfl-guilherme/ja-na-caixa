// "Saldo do mês": linha do saldo acumulado dia a dia (adaptado da linha de receita do Analytics Bento, ADR-014).
// SVG com preserveAspectRatio="none" + vector-effect="non-scaling-stroke"; rótulos em HTML.
import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import type { DiaDoMes } from '@/api/types'
import { formatarData, formatarSaldo, nomeDoMes } from '@/lib/format'
import { escalaSaldo, rotulosDosDias } from '@/lib/graficos'
import { EixoX, EixoY, LinhasGrade, SecaoPainel, TabelaOculta, type Marca } from './partes'

interface Props {
  serie: DiaDoMes[]
  /** Quantos dias desenhar (no mês corrente, até hoje). */
  ultimoDia: number
  mes: string
  progresso: number
  compacto: boolean
}

export function SaldoLineChart({ serie, ultimoDia, mes, progresso, compacto }: Props) {
  const [dia, setDia] = useState<number | null>(null)
  const totalDias = serie.length
  const desenhados = serie.slice(0, Math.max(1, ultimoDia))
  const valores = desenhados.map((d) => Number(d.saldo_acumulado))
  const { topo, base, passo } = escalaSaldo(valores)
  const y = (v: number) => ((topo - v) / (topo - base)) * 100
  const x = (d: number) => (totalDias > 1 ? ((d - 1) / (totalDias - 1)) * 100 : 0)
  const altura = compacto ? 170 : 200
  const final = desenhados[desenhados.length - 1]
  const negativo = final.saldo_acumulado.startsWith('-')
  const cor = negativo ? 'var(--jnc-despesa)' : 'var(--jnc-receita)'

  const marcas: Marca[] = []
  for (let v = topo; v >= base - 0.01; v -= passo) {
    marcas.push({ topo: y(v), rotulo: v === 0 ? formatarSaldo('0') : formatarSaldo(v.toFixed(2)), zero: v === 0 })
  }
  const linha = valores.map((v, i) => `${i ? 'L' : 'M'}${x(i + 1).toFixed(2)} ${y(v).toFixed(2)}`).join(' ')
  const chao = y(base < 0 ? 0 : base).toFixed(2)
  const area = `${linha} L ${x(desenhados.length).toFixed(2)} ${chao} L 0 ${chao} Z`

  const irPara = (d: number) => setDia(Math.max(1, Math.min(desenhados.length, d)))
  const mover = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    if (r.width > 0) irPara(Math.round(((e.clientX - r.left) / r.width) * (totalDias - 1)) + 1)
  }
  const tecla = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      irPara((dia ?? desenhados.length) - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      irPara((dia ?? 0) + 1)
    }
  }
  const nome = nomeDoMes(mes)
  const dica = dia !== null ? desenhados[dia - 1] : null

  return (
    <SecaoPainel id="t-saldo" titulo="Saldo do mês" extra={<span className="text-[13px] font-medium text-texto-2">Acumulado dia a dia</span>} className="h-full">
      <div className="grid gap-x-2" style={{ gridTemplateColumns: `${compacto ? 76 : 92}px minmax(0, 1fr)` }}>
        <EixoY marcas={marcas} altura={altura} />
        <div className="relative" style={{ height: altura }}>
          <LinhasGrade marcas={marcas} />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 block size-full overflow-visible">
            <path d={area} fill="var(--jnc-receita-grafico)" fillOpacity={(0.12 * progresso).toFixed(3)} />
            <path
              d={linha}
              fill="none"
              stroke={cor}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              // Tracejado só durante a animação: com non-scaling-stroke, o Chromium mede
              // pathLength errado e a linha final sairia com falhas.
              {...(progresso < 1 && { pathLength: 1, strokeDasharray: '1', strokeDashoffset: (1 - progresso).toFixed(3) })}
            />
          </svg>
          <div
            tabIndex={0}
            role="img"
            aria-label={`Gráfico de linha do saldo acumulado em ${nome}: começa em ${formatarSaldo(desenhados[0].saldo_acumulado)} no dia 1 e chega a ${formatarSaldo(final.saldo_acumulado)} no dia ${desenhados.length}. Use as setas para ver cada dia.`}
            onMouseMove={mover}
            onMouseLeave={() => setDia(null)}
            onFocus={() => irPara(desenhados.length)}
            onBlur={() => setDia(null)}
            onKeyDown={tecla}
            className="absolute inset-0 cursor-crosshair rounded-md"
          />
          {dica && dia !== null && (
            <>
              <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 border-l border-dashed border-guia-dica" style={{ left: `${x(dia)}%` }} />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -mt-1.5 -ml-1.5 size-3 rounded-full border-[3px] bg-branco"
                style={{ left: `${x(dia)}%`, top: `${y(Number(dica.saldo_acumulado))}%`, borderColor: cor }}
              />
              <div
                role="status"
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-[10px] bg-tinta px-2.5 py-2 text-xs leading-[1.4] font-semibold whitespace-nowrap text-branco"
                style={{ left: `${Math.min(86, Math.max(14, x(dia)))}%`, top: `${y(Number(dica.saldo_acumulado))}%` }}
              >
                <div>{formatarData(dica.data)}</div>
                <div className="text-sm font-extrabold">{formatarSaldo(dica.saldo_acumulado)}</div>
              </div>
            </>
          )}
        </div>
        <div />
        <EixoX rotulos={rotulosDosDias(totalDias, x)} />
      </div>
      <TabelaOculta
        rotulo={`Saldo acumulado por dia em ${nome}`}
        colunas={['Data', 'Saldo acumulado']}
        linhas={desenhados.map((d) => [formatarData(d.data), formatarSaldo(d.saldo_acumulado)])}
      />
    </SecaoPainel>
  )
}
