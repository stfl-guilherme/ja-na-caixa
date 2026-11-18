import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { transacoesApi } from '@/api/endpoints'
import type { FiltrosTransacao, TransacaoInput } from '@/api/types'

export function useTransacoes(filtros: FiltrosTransacao) {
  return useQuery({
    queryKey: ['transacoes', filtros],
    queryFn: () => transacoesApi.listar(filtros),
    placeholderData: keepPreviousData,
  })
}

function useInvalidarFinancas() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      ['transacoes', 'resumo', 'categorias'].map((chave) =>
        queryClient.invalidateQueries({ queryKey: [chave] }),
      ),
    )
}

export function useSalvarTransacao() {
  const invalidar = useInvalidarFinancas()
  return useMutation({
    mutationFn: ({ id, dados }: { id?: number; dados: TransacaoInput }) =>
      id ? transacoesApi.atualizar(id, dados) : transacoesApi.criar(dados),
    onSuccess: invalidar,
  })
}

export function useExcluirTransacao() {
  const invalidar = useInvalidarFinancas()
  return useMutation({
    mutationFn: (id: number) => transacoesApi.excluir(id),
    onSuccess: invalidar,
  })
}
