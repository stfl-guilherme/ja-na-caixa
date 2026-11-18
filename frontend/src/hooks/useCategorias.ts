import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriasApi } from '@/api/endpoints'
import type { CategoriaInput, Tipo } from '@/api/types'

export function useCategorias(tipo?: Tipo) {
  return useQuery({
    queryKey: ['categorias', tipo ?? 'todas'],
    queryFn: () => categoriasApi.listar(tipo),
  })
}

/** Mudanças em categorias afetam listagens de transações e o resumo. */
function useInvalidarFinancas() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      ['categorias', 'transacoes', 'resumo'].map((chave) =>
        queryClient.invalidateQueries({ queryKey: [chave] }),
      ),
    )
}

export function useSalvarCategoria() {
  const invalidar = useInvalidarFinancas()
  return useMutation({
    mutationFn: ({ id, dados }: { id?: number; dados: CategoriaInput }) =>
      id ? categoriasApi.atualizar(id, dados) : categoriasApi.criar(dados),
    onSuccess: invalidar,
  })
}

export function useExcluirCategoria() {
  const invalidar = useInvalidarFinancas()
  return useMutation({
    mutationFn: (id: number) => categoriasApi.excluir(id),
    onSuccess: invalidar,
  })
}
