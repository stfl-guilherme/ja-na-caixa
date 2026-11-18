import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { authApi } from '@/api/endpoints'
import type { Usuario } from '@/api/types'

export const CHAVE_USUARIO = ['auth', 'me'] as const

/** Usuário logado, ou null se a API responder 401 (spec 8: rotas protegidas). */
export function useUsuario() {
  return useQuery({
    queryKey: CHAVE_USUARIO,
    queryFn: async (): Promise<Usuario | null> => {
      try {
        return await authApi.me()
      } catch (erro) {
        if (erro instanceof ApiError && erro.status === 401) return null
        throw erro
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authApi.login(username, password),
    onSuccess: (usuario) => queryClient.setQueryData(CHAVE_USUARIO, usuario),
  })
}

export function useLoginDemo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.demo(),
    onSuccess: (usuario) => queryClient.setQueryData(CHAVE_USUARIO, usuario),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      queryClient.clear()
      queryClient.setQueryData(CHAVE_USUARIO, null)
    },
  })
}
