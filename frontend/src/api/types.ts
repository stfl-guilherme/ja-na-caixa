// Contrato da API (spec, seção 6). Valores monetários trafegam como string (ADR-005).

export type Tipo = 'RECEITA' | 'DESPESA'

export interface Usuario {
  id: number
  username: string
}

export interface Categoria {
  id: number
  nome: string
  tipo: Tipo
  cor: string
  transacoes: number
  criado_em: string
}

export type CategoriaInput = Pick<Categoria, 'nome' | 'tipo' | 'cor'>

export interface Transacao {
  id: number
  categoria: number
  categoria_nome: string
  categoria_cor: string
  tipo: Tipo
  descricao: string
  valor: string
  data: string
  observacao: string
  criado_em: string
  atualizado_em: string
}

export interface TransacaoInput {
  categoria: number
  descricao: string
  valor: string
  data: string
  observacao: string
}

export interface Paginado<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Totais {
  receitas: string
  despesas: string
  saldo: string
}

/** Listagem de transações com os totais do filtro, calculados no backend (spec 6.3). */
export interface ListaTransacoes extends Paginado<Transacao> {
  totais: Totais
  totais_por_dia: { data: string; saldo: string }[]
}

export interface FiltrosTransacao {
  mes?: string
  categoria?: number | ''
  tipo?: Tipo | ''
  busca?: string
  page?: number
}

export interface ResumoCategoria {
  categoria_id: number
  nome: string
  cor: string
  tipo: Tipo
  total: string
  /** Transações da categoria no mês. */
  quantidade: number
}

export interface DiaDoMes {
  data: string
  receitas: string
  despesas: string
  saldo_acumulado: string
}

export interface Resumo extends Totais {
  mes: string
  por_categoria: ResumoCategoria[]
  mes_anterior: Totais & { mes: string }
  serie_diaria: DiaDoMes[]
}

export interface ResumoAnual extends Totais {
  ano: number
  meses: (Totais & { mes: string })[]
}
