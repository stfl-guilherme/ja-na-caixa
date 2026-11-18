import { useQuery } from '@tanstack/react-query'
import { resumoApi } from '@/api/endpoints'

export function useResumo(mes: string) {
  return useQuery({ queryKey: ['resumo', mes], queryFn: () => resumoApi.obter(mes) })
}
