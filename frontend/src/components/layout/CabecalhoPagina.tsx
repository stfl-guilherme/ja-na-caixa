import type { ReactNode } from 'react'
import { useFixoAoRolar } from '@/hooks/useFixoAoRolar'
import { useTelaLarga } from '@/hooks/useTelaLarga'
import { cn } from '@/lib/utils'
import { ALTURA_HORIZONTE } from '@/lib/horizonte'
import { MonthPicker } from './MonthPicker'

interface CabecalhoPaginaProps {
  titulo: string
  /** Ação à direita (ex.: "Nova categoria"). */
  acao?: ReactNode
  /** Só no celular, ao lado do seletor de mês (Papo pequeno do Painel). */
  extraMobile?: ReactNode
}

/** Desktop: altura da barra (o título fica todo sobre o céu, que ocupa 55% de 160px = 88px). */
const ALTURA_BARRA = 72
/** `pt-4` do <main> no desktop e `pt-1` no celular. */
const RESPIRO_TOPO = { desktop: 16, mobile: 4 }
/** Espaço entre o fim da faixa de horizonte e o conteúdo. */
const ESPACO_APOS_HORIZONTE = { desktop: 24, mobile: 10 }
/** Altura da linha do mês no celular (seletor 50px + py-3). */
const ALTURA_LINHA_MES = 74

/**
 * Barra fixa ao rolar (ADR-019): transparente sobre o céu no topo da página; quando gruda,
 * ganha fundo sólido de areia, sombra suave e borda inferior.
 */
const estiloBarra = (fixo: boolean) =>
  cn(
    'sticky top-0 z-30 border-b transition-[background-color,box-shadow,border-color] duration-200 motion-reduce:transition-none',
    fixo ? 'border-borda-sutil bg-fundo-app shadow-[0_6px_16px_rgba(20,32,40,0.08)]' : 'border-transparent bg-transparent',
  )

/** Título + seletor de mês, como no topo de todas as telas internas do design. */
export function CabecalhoPagina({ titulo, acao, extraMobile }: CabecalhoPaginaProps) {
  const larga = useTelaLarga()
  const { marcador, fixo } = useFixoAoRolar<HTMLDivElement>()
  if (larga) {
    const depois = ALTURA_HORIZONTE.desktop + ESPACO_APOS_HORIZONTE.desktop - RESPIRO_TOPO.desktop - ALTURA_BARRA - 1
    return (
      <>
        <div ref={marcador} aria-hidden="true" className="h-px" />
        <header
          data-fixo={fixo}
          className={cn(estiloBarra(fixo), '-mx-10 flex items-center gap-5 px-10')}
          style={{ height: ALTURA_BARRA, marginBottom: depois }}
        >
          <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.4px] text-tinta">{titulo}</h1>
          <MonthPicker />
          <div className="flex-1" />
          {acao}
        </header>
      </>
    )
  }
  const antesDoTitulo = ALTURA_HORIZONTE.mobile + ESPACO_APOS_HORIZONTE.mobile - RESPIRO_TOPO.mobile - ALTURA_LINHA_MES - 1
  return (
    <>
      <div ref={marcador} aria-hidden="true" className="h-px" />
      {/* No celular, só a linha do mês fica fixa: o título rola com a página, abaixo da faixa. */}
      <div data-fixo={fixo} className={cn(estiloBarra(fixo), '-mx-4 flex items-end gap-2 px-4 py-3')}>
        <MonthPicker className="min-w-0 flex-1 justify-between" />
        {extraMobile}
      </div>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3" style={{ marginTop: antesDoTitulo }}>
        <h1 className="m-0 text-2xl font-extrabold tracking-[-0.3px]">{titulo}</h1>
        {acao}
      </header>
    </>
  )
}
