// "Entradas e saídas por dia": receitas acima e despesas abaixo do eixo (adaptado das ondas espelhadas, ADR-014).
// Sem animação contínua: as barras só crescem na entrada.
import type { DiaDoMes } from '@/api/types'
import { formatarComSinal, formatarData, formatarMoeda, nomeDoMes } from '@/lib/format'
import { rotulosDosDias, topoRedondo } from '@/lib/graficos'
import { EixoX, EixoY, Legenda, LinhasGrade, SecaoPainel, TabelaOculta, type Marca } from './partes'

export function FluxoEspelhadoChart({ serie, mes, progresso, compacto }: { serie: DiaDoMes[]; mes: string; progresso: number; compacto: boolean }) {
  const n = serie.length
  const receitas = serie.map((d) => Number(d.receitas))
  const despesas = serie.map((d) => Number(d.despesas))
  const topo = topoRedondo(Math.max(...receitas, ...despesas, 0))
  const altura = compacto ? 170 : 200
  const barra = (v: number) => (v / topo) * 48 * progresso
  const rec = receitas.map((v, i) => (v > 0 ? `M${i * 10 + 2} ${(50 - barra(v)).toFixed(2)} h6 v${barra(v).toFixed(2)} h-6 Z` : '')).join(' ')
  const desp = despesas.map((v, i) => (v > 0 ? `M${i * 10 + 2} 50 h6 v${barra(v).toFixed(2)} h-6 Z` : '')).join(' ')
  const marcas: Marca[] = [
    { topo: 2, rotulo: `+ ${formatarMoeda(String(topo))}` },
    { topo: 50, rotulo: formatarMoeda('0'), zero: true },
    { topo: 98, rotulo: `− ${formatarMoeda(String(topo))}` },
  ]
  const nome = nomeDoMes(mes)
  const maior = (lista: DiaDoMes[], campo: 'receitas' | 'despesas') =>
    lista.reduce((m, d) => (Number(d[campo]) > Number(m[campo]) ? d : m), lista[0])[campo]
  const comMovimento = serie.filter((d) => Number(d.receitas) > 0 || Number(d.despesas) > 0)

  return (
    <SecaoPainel
      id="t-fluxo"
      titulo="Entradas e saídas por dia"
      extra={
        <Legenda
          itens={[
            { cor: 'var(--jnc-receita-grafico)', rotulo: 'Receitas (acima)' },
            { cor: 'var(--jnc-despesa-grafico)', rotulo: 'Despesas (abaixo)' },
          ]}
        />
      }
    >
      <div className="grid gap-x-2" style={{ gridTemplateColumns: `${compacto ? 76 : 92}px minmax(0, 1fr)` }}>
        <EixoY marcas={marcas} altura={altura} />
        <div
          role="img"
          aria-label={`Gráfico espelhado de receitas e despesas por dia em ${nome}. Maior receita em um dia: ${formatarMoeda(maior(serie, 'receitas'))}. Maior despesa em um dia: ${formatarMoeda(maior(serie, 'despesas'))}. Detalhes na tabela a seguir.`}
          className="relative"
          style={{ height: altura }}
        >
          <LinhasGrade marcas={marcas} />
          <svg viewBox={`0 0 ${n * 10} 100`} preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 block size-full">
            <path d={rec || 'M0 0'} fill="var(--jnc-receita-grafico)" />
            <path d={desp || 'M0 0'} fill="var(--jnc-despesa-grafico)" />
          </svg>
        </div>
        <div />
        <EixoX rotulos={rotulosDosDias(n, (d) => (((d - 1) * 10 + 5) / (n * 10)) * 100)} />
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
    </SecaoPainel>
  )
}
