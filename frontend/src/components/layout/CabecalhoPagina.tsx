import type { ReactNode } from 'react'
import { useTelaLarga } from '@/hooks/useTelaLarga'
import { MonthPicker } from './MonthPicker'

interface CabecalhoPaginaProps {
  titulo: string
  /** Ação à direita (ex.: "Nova categoria"). */
  acao?: ReactNode
  /** Só no celular, ao lado do seletor de mês (Papo pequeno do Painel). */
  extraMobile?: ReactNode
}

/** Título + seletor de mês, como no topo de todas as telas internas do design. */
export function CabecalhoPagina({ titulo, acao, extraMobile }: CabecalhoPaginaProps) {
  const larga = useTelaLarga()
  if (larga) {
    return (
      // Fixo ao rolar (ADR-019); o fundo areia cobre o conteúdo que passa por baixo.
      <header className="sticky top-0 z-30 -mx-10 mb-6 flex min-h-14 items-center gap-5 bg-fundo-app/95 px-10 py-3 backdrop-blur">
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.4px]">{titulo}</h1>
        <MonthPicker />
        <div className="flex-1" />
        {acao}
      </header>
    )
  }
  return (
    <>
      {/* No celular, só a linha do mês fica fixa: o título rola com a página. */}
      <div className="sticky top-0 z-30 -mx-4 flex items-end gap-2 bg-fundo-app/95 px-4 py-3 backdrop-blur">
        <MonthPicker className="min-w-0 flex-1 justify-between" />
        {extraMobile}
      </div>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 pt-0.5">
        <h1 className="m-0 text-2xl font-extrabold tracking-[-0.3px]">{titulo}</h1>
        {acao}
      </header>
    </>
  )
}
