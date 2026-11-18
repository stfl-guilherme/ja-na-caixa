// "Seu ano até agora": barras de receitas e despesas dos 12 meses, lado a lado.
// Substitui o radar de sazonalidade, que deformava os valores (ADR-014).
import { useState, type MouseEvent } from 'react'
import type { ResumoAnual } from '@/api/types'
import { formatarComSinal, formatarMoeda } from '@/lib/format'
import { moverComSetas, topoRedondo } from '@/lib/graficos'
import { cn } from '@/lib/utils'
import { CartaoGrafico, Dica, EixoY, Legenda, LinhasGrade, TabelaOculta, TituloEixo, type Marca } from './partes'

const ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
/** No celular, só a inicial: as abreviações de 3 letras se sobrepõem em 375px. */
const INICIAL = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const NOMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

interface Props {
  anual: ResumoAnual
  /** Mês em destaque ("AAAA-MM"). */
  mes: string
  /** Meses depois deste ("AAAA-MM") ainda não aconteceram. */
  hoje: string
  progresso: number
  compacto: boolean
}

export function AnoBarChart({ anual, mes, hoje, progresso, compacto }: Props) {
  const [indice, setIndice] = useState<number | null>(null)
  const meses = anual.meses.map((m) => ({ ...m, futuro: m.mes > hoje, rec: Number(m.receitas), desp: Number(m.despesas) }))
  const topo = topoRedondo(Math.max(...meses.map((m) => Math.max(m.rec, m.desp)), 0), 2000)
  const y = (v: number) => 100 - (v / topo) * 96 * progresso
  const altura = compacto ? 220 : 300
  const rec = meses.map((m, i) => (m.futuro ? '' : `M${i * 10 + 1.6} 100 V${y(m.rec).toFixed(2)} h3.2 V100 Z`)).join(' ')
  const desp = meses.map((m, i) => (m.futuro ? '' : `M${i * 10 + 5.2} 100 V${y(m.desp).toFixed(2)} h3.2 V100 Z`)).join(' ')
  const marcas: Marca[] = [1, 0.75, 0.5, 0.25, 0].map((f) => ({ topo: 100 - f * 96, rotulo: formatarMoeda(String(topo * f)), zero: f === 0 }))
  const passados = meses.filter((m) => !m.futuro)
  const semDados = meses.filter((m) => m.futuro).map((m) => NOMES[Number(m.mes.slice(5)) - 1])
  const ir = (i: number) => setIndice(Math.max(0, Math.min(11, i)))
  const mover = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    if (r.width > 0) ir(Math.floor(((e.clientX - r.left) / r.width) * 12))
  }
  const escolhido = indice !== null ? meses[indice] : null

  return (
    <CartaoGrafico
      extra={
        <Legenda
          itens={[
            { cor: 'var(--jnc-receita-grafico)', rotulo: 'Receitas' },
            { cor: 'var(--jnc-despesa-grafico)', rotulo: 'Despesas' },
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
          <svg viewBox="0 0 120 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 block size-full">
            <path d={rec || 'M0 0'} fill="var(--jnc-receita-grafico)" />
            <path d={desp || 'M0 0'} fill="var(--jnc-despesa-grafico)" />
          </svg>
          <div
            tabIndex={0}
            role="img"
            aria-label={`Gráfico de barras de ${anual.ano} com receitas e despesas lado a lado por mês${passados.length ? `, de ${NOMES[0]} a ${NOMES[passados.length - 1]}` : ''}.${semDados.length ? ` ${semDados.length === 1 ? `${semDados[0]} ainda sem dados` : 'Meses seguintes ainda sem dados'}.` : ''} Use as setas para ver cada mês; detalhes na tabela a seguir.`}
            onMouseMove={mover}
            onMouseLeave={() => setIndice(null)}
            onFocus={() => ir(Math.max(0, passados.length - 1))}
            onBlur={() => setIndice(null)}
            onKeyDown={(e) => moverComSetas(e, indice, 12, ir)}
            className="absolute inset-0 cursor-crosshair rounded-md"
          />
          {escolhido && indice !== null && (
            <Dica esquerda={((indice + 0.5) / 12) * 100} topo={20}>
              <div className="capitalize">{`${NOMES[indice]} de ${anual.ano}`}</div>
              {escolhido.futuro ? (
                <div className="text-sm font-extrabold">Ainda sem dados</div>
              ) : (
                <>
                  <div className="text-sm font-extrabold">Entrou {formatarMoeda(escolhido.receitas)}</div>
                  <div className="text-sm font-extrabold">Saiu {formatarMoeda(escolhido.despesas)}</div>
                </>
              )}
            </Dica>
          )}
        </div>
        <div />
        <div aria-hidden="true" className="grid h-[22px] grid-cols-12 pt-1.5 text-center text-[11px] font-semibold text-texto-2">
          {meses.map((m, i) => (
            <span key={m.mes} className={cn(m.mes === mes && 'font-extrabold text-tinta')}>
              {compacto ? INICIAL[i] : m.futuro ? `${ABREV[i]} —` : ABREV[i]}
            </span>
          ))}
        </div>
        <div />
        <TituloEixo className="mt-1 text-center">Mês de {anual.ano}</TituloEixo>
      </div>
      <TabelaOculta
        rotulo={`Receitas e despesas por mês em ${anual.ano}`}
        colunas={['Mês', 'Receitas', 'Despesas']}
        linhas={meses.map((m, i) =>
          m.futuro ? [NOMES[i], 'sem dados', 'sem dados'] : [NOMES[i], formatarComSinal(m.receitas, 'RECEITA'), formatarComSinal(m.despesas, 'DESPESA')],
        )}
      />
    </CartaoGrafico>
  )
}
