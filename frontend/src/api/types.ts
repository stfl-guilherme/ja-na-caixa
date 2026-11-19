// Contrato da API (spec, seção 6). Valores monetários trafegam como string (ADR-005).

export type Tipo = 'RECEITA' | 'DESPESA'

/** Modos do login de demonstração (spec, seção 7; ADR-018). */
export type ModoDemo = 'exemplo' | 'vazio'

export interface Usuario {
  id: number
  username: string
}

export interface Categoria {
  id: number
  nome: string
  tipo: Tipo
  cor: string
  /** Limite mensal (só despesas); `null` sem limite (spec 17.1). */
  limite_mensal: string | null
  transacoes: number
  criado_em: string
}

/** Sem `limite_mensal`, o limite não muda; `null` remove. */
export type CategoriaInput = Pick<Categoria, 'nome' | 'tipo' | 'cor'> & { limite_mensal?: string | null }

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

export type SituacaoOrcamento = 'ok' | 'atencao' | 'estourado'

/** Orçamento de uma categoria de despesa no mês (spec 17.1). */
export interface Orcamento {
  categoria_id: number
  nome: string
  cor: string
  limite: string
  gasto: string
  /** Percentual do limite usado, com 2 casas ("127.50"). */
  percentual: string
  /** Quanto passou do limite ("0.00" se não passou), calculado no backend. */
  excesso: string
  situacao: SituacaoOrcamento
}
