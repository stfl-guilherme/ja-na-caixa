import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Seção do Painel em fluxo vertical (ADR-019): título h2 + uma linha de descrição
 * em linguagem simples; o conteúdo vem abaixo.
 */
export function SecaoPainel({
  id,
  titulo,
  descricao,
  acao,
  children,
}: {
  id: string
  titulo: string
  descricao: string
  acao?: ReactNode
  children: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="flex flex-col gap-1">
          <h2 id={id} className="m-0 text-xl font-extrabold tracking-[-0.2px]">
            {titulo}
          </h2>
          <p className="m-0 text-[15px] font-medium text-texto-2">{descricao}</p>
        </div>
        {acao}
      </header>
      {children}
    </section>
  )
}

/** Cartão branco que envolve um gráfico; `extra` fica no topo (legenda). */
export function CartaoGrafico({ extra, className, children }: { extra?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={cn('relative min-w-0 rounded-cartao bg-branco px-[22px] py-5 shadow-cartao', className)}>
      {extra && <div className="mb-3.5 flex flex-wrap items-center justify-end gap-x-4 gap-y-2">{extra}</div>}
      {children}
    </div>
  )
}

/** Título de eixo: as unidades sempre aparecem escritas (ADR-019). */
export function TituloEixo({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('block text-xs font-bold text-texto-3', className)}>{children}</span>
}

/** Caixa do tooltip dos gráficos (lida pelo leitor de tela como status). */
export function Dica({ esquerda, topo, children }: { esquerda: number; topo: number; children: ReactNode }) {
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-[10px] bg-tinta px-2.5 py-2 text-xs leading-[1.4] font-semibold whitespace-nowrap text-branco"
      style={{ left: `${Math.min(86, Math.max(14, esquerda))}%`, top: `${topo}%` }}
    >
      {children}
    </div>
  )
}

export function Legenda({ itens }: { itens: { cor: string; rotulo: string }[] }) {
  return (
    <div className="flex flex-wrap gap-3.5 text-[13px] font-semibold text-texto-3">
      {itens.map(({ cor, rotulo }) => (
        <span key={rotulo} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-[3px]" style={{ background: cor }} />
          {rotulo}
        </span>
      ))}
    </div>
  )
}

/** Tabela equivalente ao gráfico, só para leitores de tela (README do design, Acessibilidade). */
export function TabelaOculta({ rotulo, colunas, linhas }: { rotulo: string; colunas: string[]; linhas: string[][] }) {
  return (
    // O recorte fica num div: <table> ignora width/height de 1px e esticaria a página.
    <div className="sr-only">
    <table aria-label={rotulo}>
      <thead>
        <tr>
          {colunas.map((c) => (
            <th key={c} scope="col">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((linha) => (
          <tr key={linha[0]}>
            {linha.map((celula, i) => (
              <td key={i}>{celula}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  )
}

export interface Marca {
  topo: number
  rotulo: string
  zero?: boolean
}

/** Rótulos do eixo Y (em HTML, para não distorcer com o SVG esticado). */
export function EixoY({ marcas, altura }: { marcas: Marca[]; altura: number }) {
  return (
    <div aria-hidden="true" className="relative" style={{ height: altura }}>
      {marcas.map((m) => (
        <span
          key={m.rotulo + m.topo}
          className="absolute right-0 -translate-y-1/2 text-[11px] font-semibold whitespace-nowrap text-texto-2"
          style={{ top: `${m.topo}%` }}
        >
          {m.rotulo}
        </span>
      ))}
    </div>
  )
}

export function LinhasGrade({ marcas }: { marcas: Marca[] }) {
  return (
    <>
      {marcas.map((m) => (
        <div
          key={m.rotulo + m.topo}
          aria-hidden="true"
          className={cn('absolute inset-x-0 border-t', m.zero ? 'border-solid border-eixo-zero' : 'border-dashed border-grade')}
          style={{ top: `${m.topo}%` }}
        />
      ))}
    </>
  )
}

export function EixoX({ rotulos }: { rotulos: { esquerda: number; texto: string }[] }) {
  return (
    <div aria-hidden="true" className="relative h-[22px]">
      {rotulos.map((r) => (
        <span key={r.texto} className="absolute top-1.5 -translate-x-1/2 text-[11px] font-semibold text-texto-2" style={{ left: `${r.esquerda}%` }}>
          {r.texto}
        </span>
      ))}
    </div>
  )
}
