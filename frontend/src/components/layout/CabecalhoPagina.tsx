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
      <header className="mb-6 flex min-h-14 items-center gap-5">
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.4px]">{titulo}</h1>
        <MonthPicker />
        <div className="flex-1" />
        {acao}
      </header>
    )
  }
  return (
    <header className="mb-4 flex flex-col gap-3.5">
      <div className="flex items-end gap-2">
        <MonthPicker className="min-w-0 flex-1 justify-between" />
        {extraMobile}
      </div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="m-0 text-2xl font-extrabold tracking-[-0.3px]">{titulo}</h1>
        {acao}
      </div>
    </header>
  )
}
