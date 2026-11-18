import { useEffect, useState } from 'react'
import { prefereMenosMovimento } from '@/hooks/useTelaLarga'

const DURACAO_MS = 900

/**
 * Progresso (0 → 1, ease-out cúbico) da animação de entrada do Painel.
 * Roda uma vez, na montagem; nada em loop. Com prefers-reduced-motion, já começa em 1.
 */
export function useEntrada(animar = true): number {
  const [progresso, setProgresso] = useState(() => (animar && !prefereMenosMovimento() ? 0 : 1))

  useEffect(() => {
    if (progresso >= 1) return
    const inicio = performance.now()
    let quadro = 0
    const passo = (agora: number) => {
      const k = Math.min(1, (agora - inicio) / DURACAO_MS)
      setProgresso(1 - (1 - k) ** 3)
      if (k < 1) quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
    // Só na montagem: animação de entrada.
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return progresso
}

/**
 * Valor exibido durante a contagem animada. Os quadros intermediários são só
 * exibição; o último é a string exata da API, sem arredondar centavos (ADR-014).
 */
export function valorDaContagem(valor: string, progresso: number): string {
  return progresso >= 1 ? valor : (Number(valor) * progresso).toFixed(2)
}
