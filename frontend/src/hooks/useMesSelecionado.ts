import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { mesAtual } from '@/lib/format'

const MES_VALIDO = /^\d{4}-(0[1-9]|1[0-2])$/

/**
 * Mês de referência global, guardado em `?mes=AAAA-MM` (ADR-016).
 * Vale para Painel, Transações e Categorias.
 */
export function useMesSelecionado() {
  const [busca, setBusca] = useSearchParams()
  const naUrl = busca.get('mes')
  const mes = naUrl && MES_VALIDO.test(naUrl) ? naUrl : mesAtual()

  const setMes = useCallback(
    (novo: string) =>
      setBusca((atual) => {
        const proxima = new URLSearchParams(atual)
        proxima.set('mes', novo)
        proxima.delete('page')
        return proxima
      }),
    [setBusca],
  )

  const comMes = useCallback(
    (caminho: string, extras: Record<string, string> = {}) =>
      `${caminho}?${new URLSearchParams({ mes, ...extras }).toString()}`,
    [mes],
  )

  return { mes, setMes, comMes }
}
