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

/** Formas de pagamento (spec 17.3; ADR-023). */
export type FormaPagamento =
  | 'PIX'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'DINHEIRO'
  | 'BOLETO'
  | 'TRANSFERENCIA'
  | 'NAO_INFORMADO'

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
  forma_pagamento: FormaPagamento
  forma_pagamento_rotulo: string
  /** Repete todo mês (spec 17.4). */
  fixa: boolean
  /** Original de que esta é cópia; `null` se não for repetição. */
  repetida_de: number | null
  criado_em: string
  atualizado_em: string
}

export interface TransacaoInput {
  categoria: number
  descricao: string
  valor: string
  data: string
  observacao: string
  forma_pagamento: FormaPagamento
  fixa: boolean
}

/** Fixa do mês anterior que ainda pode ser repetida, com a data sugerida no mês de destino. */
export interface FixaParaRepetir extends Transacao {
  data_sugerida: string
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
  forma_pagamento?: FormaPagamento | ''
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
  /** Despesas do mês por forma; "Não informado" por último (spec 17.3). */
  despesas_por_forma: { forma: FormaPagamento; rotulo: string; total: string; percentual: string }[]
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

export type TipoDica = 'alerta' | 'info' | 'parabens' | 'primeiros_passos'

/** Dica do Papo, gerada por regras fixas no backend (spec 17.2). */
export interface Dica {
  id: string
  tipo: TipoDica
  texto: string
  link: string | null
}
