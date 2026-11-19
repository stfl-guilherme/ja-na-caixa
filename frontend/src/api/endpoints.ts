import { api } from './client'
import type {
  Categoria,
  CategoriaInput,
  Dica,
  FiltrosTransacao,
  ListaTransacoes,
  ModoDemo,
  Orcamento,
  Resumo,
  ResumoAnual,
  Tipo,
  Transacao,
  TransacaoInput,
  Usuario,
} from './types'

export const authApi = {
  me: () => api<Usuario>('/auth/me/'),
  login: (username: string, password: string) =>
    api<Usuario>('/auth/login/', { method: 'POST', body: { username, password } }),
  demo: (modo: ModoDemo = 'exemplo') => api<Usuario>('/auth/demo/', { method: 'POST', body: { modo } }),
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
    api<ListaTransacoes>('/transacoes/', { params: { ...filtros } }),
  criar: (dados: TransacaoInput) => api<Transacao>('/transacoes/', { method: 'POST', body: dados }),
  atualizar: (id: number, dados: TransacaoInput) =>
    api<Transacao>(`/transacoes/${id}/`, { method: 'PUT', body: dados }),
  excluir: (id: number) => api<void>(`/transacoes/${id}/`, { method: 'DELETE' }),
}

export const resumoApi = {
  obter: (mes: string) => api<Resumo>('/resumo/', { params: { mes } }),
  anual: (ano: number) => api<ResumoAnual>('/resumo/anual/', { params: { ano } }),
}

export const orcamentosApi = {
  listar: (mes: string) => api<Orcamento[]>('/orcamentos/', { params: { mes } }),
}

export const dicasApi = {
  listar: (mes: string) => api<Dica[]>('/dicas/', { params: { mes } }),
}
