import { api } from './client'
import type {
  Categoria,
  CategoriaInput,
  FiltrosTransacao,
  Paginado,
  Resumo,
  Tipo,
  Transacao,
  TransacaoInput,
  Usuario,
} from './types'

export const authApi = {
  me: () => api<Usuario>('/auth/me/'),
  login: (username: string, password: string) =>
    api<Usuario>('/auth/login/', { method: 'POST', body: { username, password } }),
  demo: () => api<Usuario>('/auth/demo/', { method: 'POST' }),
  logout: () => api<void>('/auth/logout/', { method: 'POST' }),
}

export const categoriasApi = {
  listar: (tipo?: Tipo) => api<Categoria[]>('/categorias/', { params: { tipo } }),
  criar: (dados: CategoriaInput) => api<Categoria>('/categorias/', { method: 'POST', body: dados }),
  atualizar: (id: number, dados: CategoriaInput) =>
    api<Categoria>(`/categorias/${id}/`, { method: 'PUT', body: dados }),
  excluir: (id: number) => api<void>(`/categorias/${id}/`, { method: 'DELETE' }),
}

export const transacoesApi = {
  listar: (filtros: FiltrosTransacao = {}) =>
    api<Paginado<Transacao>>('/transacoes/', { params: { ...filtros } }),
  criar: (dados: TransacaoInput) => api<Transacao>('/transacoes/', { method: 'POST', body: dados }),
  atualizar: (id: number, dados: TransacaoInput) =>
    api<Transacao>(`/transacoes/${id}/`, { method: 'PUT', body: dados }),
  excluir: (id: number) => api<void>(`/transacoes/${id}/`, { method: 'DELETE' }),
}

export const resumoApi = {
  obter: (mes: string) => api<Resumo>('/resumo/', { params: { mes } }),
}
