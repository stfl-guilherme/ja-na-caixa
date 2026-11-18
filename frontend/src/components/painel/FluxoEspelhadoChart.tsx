// "Entradas e saídas por dia": barras espelhadas, receitas para cima e despesas para baixo (ADR-014, ADR-019).
// Sem animação contínua: as barras só crescem na entrada.
import { useState, type MouseEvent } from 'react'
import type { DiaDoMes } from '@/api/types'
import { formatarComSinal, formatarData, formatarMoeda, nomeDoMes } from '@/lib/format'
import { moverComSetas, rotulosDosDias, topoRedondo } from '@/lib/graficos'
import { CartaoGrafico, Dica, EixoX, EixoY, Legenda, LinhasGrade, TabelaOculta, TituloEixo, type Marca } from './partes'

export function FluxoEspelhadoChart({ serie, mes, progresso, compacto }: { serie: DiaDoMes[]; mes: string; progresso: number; compacto: boolean }) {
  const [indice, setIndice] = useState<number | null>(null)
  const n = serie.length
  const receitas = serie.map((d) => Number(d.receitas))
  const despesas = serie.map((d) => Number(d.despesas))
  const topo = topoRedondo(Math.max(...receitas, ...despesas, 0))
  const altura = compacto ? 220 : 300
  const barra = (v: number) => (v / topo) * 48 * progresso
  const rec = receitas.map((v, i) => (v > 0 ? `M${i * 10 + 2} ${(50 - barra(v)).toFixed(2)} h6 v${barra(v).toFixed(2)} h-6 Z` : '')).join(' ')
  const desp = despesas.map((v, i) => (v > 0 ? `M${i * 10 + 2} 50 h6 v${barra(v).toFixed(2)} h-6 Z` : '')).join(' ')
  const marcas: Marca[] = [
    { topo: 2, rotulo: `+ ${formatarMoeda(String(topo))}` },
    { topo: 26, rotulo: `+ ${formatarMoeda(String(topo / 2))}` },
    { topo: 50, rotulo: formatarMoeda('0'), zero: true },
    { topo: 74, rotulo: `− ${formatarMoeda(String(topo / 2))}` },
    { topo: 98, rotulo: `− ${formatarMoeda(String(topo))}` },
  ]
  const nome = nomeDoMes(mes)
  const maior = (campo: 'receitas' | 'despesas') => serie.reduce((m, d) => (Number(d[campo]) > Number(m[campo]) ? d : m), serie[0])[campo]
  const comMovimento = serie.filter((d) => Number(d.receitas) > 0 || Number(d.despesas) > 0)
  const centro = (i: number) => ((i * 10 + 5) / (n * 10)) * 100
  const ir = (i: number) => setIndice(Math.max(0, Math.min(n - 1, i)))
  const mover = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    if (r.width > 0) ir(Math.floor(((e.clientX - r.left) / r.width) * n))
  }
  const dia = indice !== null ? serie[indice] : null

  return (
    <CartaoGrafico
      extra={
        <Legenda
          itens={[
            { cor: 'var(--jnc-receita-grafico)', rotulo: 'Receitas (para cima)' },
            { cor: 'var(--jnc-despesa-grafico)', rotulo: 'Despesas (para baixo)' },
          ]}
        />
      }
    >
      <div className="grid gap-x-2" style={{ gridTemplateColumns: `${compacto ? 76 : 96}px minmax(0, 1fr)` }}>
        <TituloEixo className="mb-2 text-right">Valor (R$)</TituloEixo>
        <div />
        <EixoY marcas={marcas} altura={altura} />
        <div className="relative" style={{ height: altura }}>
          <LinhasGrade marcas={marcas} />
          <svg viewBox={`0 0 ${n * 10} 100`} preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 block size-full">
            <path d={rec || 'M0 0'} fill="var(--jnc-receita-grafico)" />
            <path d={desp || 'M0 0'} fill="var(--jnc-despesa-grafico)" />
          </svg>
          <div
            tabIndex={0}
            role="img"
            aria-label={`Gráfico de barras espelhadas de receitas e despesas por dia em ${nome}. Maior receita em um dia: ${formatarMoeda(maior('receitas'))}. Maior despesa em um dia: ${formatarMoeda(maior('despesas'))}. Use as setas para ver cada dia; detalhes na tabela a seguir.`}
            onMouseMove={mover}
            onMouseLeave={() => setIndice(null)}
            onFocus={() => ir(0)}
            onBlur={() => setIndice(null)}
            onKeyDown={(e) => moverComSetas(e, indice, n, ir)}
            className="absolute inset-0 cursor-crosshair rounded-md"
          />
          {dia && indice !== null && (
            <>
              <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-[3%] -translate-x-1/2 rounded bg-tinta/5" style={{ left: `${centro(indice)}%` }} />
              <Dica esquerda={centro(indice)} topo={20}>
                <div>{formatarData(dia.data)}</div>
                <div className="text-sm font-extrabold">Entrou {formatarMoeda(dia.receitas)}</div>
                <div className="text-sm font-extrabold">Saiu {formatarMoeda(dia.despesas)}</div>
              </Dica>
            </>
          )}
        </div>
        <div />
        <EixoX rotulos={rotulosDosDias(n, (d) => centro(d - 1))} />
        <div />
        <TituloEixo className="mt-1 text-center">Dia do mês</TituloEixo>
      </div>
      <TabelaOculta
        rotulo={`Receitas e despesas por dia em ${nome}`}
        colunas={['Data', 'Receitas', 'Despesas']}
        linhas={comMovimento.map((d) => [
          formatarData(d.data),
          Number(d.receitas) > 0 ? formatarComSinal(d.receitas, 'RECEITA') : '—',
          Number(d.despesas) > 0 ? formatarComSinal(d.despesas, 'DESPESA') : '—',
        ])}
      />
    </CartaoGrafico>
  )
}
