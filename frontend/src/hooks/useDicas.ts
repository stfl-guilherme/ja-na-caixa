import { useQuery } from '@tanstack/react-query'
import { dicasApi } from '@/api/endpoints'

/** A chave começa com 'resumo' para ser invalidada junto com o resumo quando algo muda. */
export function useDicas(mes: string) {
  return useQuery({ queryKey: ['resumo', 'dicas', mes], queryFn: () => dicasApi.listar(mes) })
}
