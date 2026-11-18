import { useQuery } from '@tanstack/react-query'
import { resumoApi } from '@/api/endpoints'

export function useResumo(mes: string) {
  return useQuery({ queryKey: ['resumo', mes], queryFn: () => resumoApi.obter(mes) })
}

/** A chave começa com 'resumo' para ser invalidada junto com o resumo do mês. */
export function useResumoAnual(ano: number) {
  return useQuery({ queryKey: ['resumo', 'anual', ano], queryFn: () => resumoApi.anual(ano) })
}
