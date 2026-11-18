import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Cartão de seção do Painel: branco, raio 20, sombra suave, título h2 de 17px. */
export function SecaoPainel({
  id,
  titulo,
  extra,
  className,
  children,
}: {
  id: string
  titulo: string
  extra?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section aria-labelledby={id} className={cn('relative min-w-0 rounded-cartao bg-branco px-[22px] py-5 shadow-cartao', className)}>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 id={id} className="m-0 text-[17px] font-bold">
          {titulo}
        </h2>
        {extra}
      </div>
      {children}
    </section>
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
    <table className="sr-only" aria-label={rotulo}>
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
