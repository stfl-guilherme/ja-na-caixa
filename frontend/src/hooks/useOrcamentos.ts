import { useQuery } from '@tanstack/react-query'
import { orcamentosApi } from '@/api/endpoints'

/** A chave começa com 'resumo' para ser invalidada junto com o resumo quando algo muda. */
export function useOrcamentos(mes: string) {
  return useQuery({ queryKey: ['resumo', 'orcamentos', mes], queryFn: () => orcamentosApi.listar(mes) })
}
