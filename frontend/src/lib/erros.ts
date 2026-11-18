import { ApiError } from '@/api/client'

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ApiError) return erro.message
  return 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.'
}
