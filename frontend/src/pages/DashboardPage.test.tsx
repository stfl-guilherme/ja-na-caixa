import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Dica, Orcamento, Resumo, Transacao } from '@/api/types'
import { resumoAnual2026, resumoNovembro, serieNovembro } from '@/test/fixtures'
import { chamadas, mockFetch, personagensNaTela, renderComRotas } from '@/test/utils'
import DashboardPage from './DashboardPage'

const semNbsp = (texto: string | null) => (texto ?? '').replace(/ /g, ' ')

function transacao(id: number): Transacao {
  return {
    id,
    categoria: 3,
    categoria_nome: 'Mercado',
    categoria_cor: '#B5541A',
    tipo: 'DESPESA',
    descricao: `Compra ${id}`,
    valor: '10.00',
    data: '2026-11-10',
    observacao: '',
    forma_pagamento: 'NAO_INFORMADO',
    forma_pagamento_rotulo: 'Não informado',
    criado_em: '',
    atualizado_em: '',
  }
}

const lista = (n: number) => ({
  count: n,
  next: null,
  previous: null,
  results: Array.from({ length: n }, (_, i) => transacao(i + 1)),
  totais: { receitas: '0.00', despesas: '0.00', saldo: '0.00' },
  totais_por_dia: [],
})

const vazio: Resumo = {
  ...resumoNovembro,
  receitas: '0.00',
  despesas: '0.00',
  saldo: '0.00',
  por_categoria: [],
  serie_diaria: serieNovembro(),
}

const CATEGORIA_USADA = { id: 1, nome: 'Mercado', tipo: 'DESPESA', cor: '#B5541A', limite_mensal: null, transacoes: 3, criado_em: '' }

const ORCAMENTOS: Orcamento[] = [
  { categoria_id: 4, nome: 'Lazer', cor: '#8C6A0C', limite: '300.00', gasto: '382.50', percentual: '127.50', excesso: '82.50', situacao: 'estourado' },
  { categoria_id: 3, nome: 'Mercado', cor: '#B5541A', limite: '500.00', gasto: '340.00', percentual: '68.00', excesso: '0.00', situacao: 'ok' },
]

function rotas(
  resumo: Resumo = resumoNovembro,
  transacoes = lista(0),
  categorias: unknown[] = [CATEGORIA_USADA],
  orcamentos: Orcamento[] = ORCAMENTOS,
  dicas: { status?: number; corpo: unknown } = { corpo: [] },
) {
  return mockFetch([
    { caminho: '/api/categorias/', corpo: categorias },
    { caminho: '/api/dicas/', ...dicas },
    { caminho: '/api/orcamentos/', corpo: orcamentos },
    { caminho: '/api/resumo/', corpo: resumo },
    { caminho: '/api/resumo/anual/', corpo: resumoAnual2026 },
    { caminho: '/api/transacoes/', corpo: transacoes },
  ])
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 17))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('mostra receitas, despesas e saldo vindos do resumo, com comparação', async () => {
    rotas()
    renderComRotas(<DashboardPage />)
    const receitas = await screen.findByRole('link', { name: /^Receitas de novembro/ })
    expect(semNbsp(receitas.textContent)).toContain('+ R$ 6.686,42')
    expect(semNbsp(screen.getByRole('link', { name: /^Despesas de novembro/ }).textContent)).toContain('− R$ 3.711,81')
    const saldo = screen.getByRole('link', { name: /^Saldo de novembro/ })
    expect(semNbsp(saldo.textContent)).toContain('+ R$ 2.974,61')
    expect(saldo).toHaveTextContent('vs outubro · sobrou mais')
  })

  it('mostra os gráficos com resumo acessível', async () => {
    rotas()
    renderComRotas(<DashboardPage />)
    expect(await screen.findByRole('img', { name: /saldo acumulado em novembro/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /barras espelhadas/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Mapa de árvore/ })).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /Gráfico de barras de 2026/ })).toBeInTheDocument()
    const mapa = screen.getByRole('region', { name: 'Para onde foi o dinheiro' })
    expect(within(mapa).getAllByText('Moradia').length).toBeGreaterThan(0)
    expect(within(mapa).queryByText('Salário')).not.toBeInTheDocument()
  })

  it('mostra as 5 últimas transações do mês', async () => {
    rotas(resumoNovembro, lista(8))
    renderComRotas(<DashboardPage />)
    const ultimas = await screen.findByRole('region', { name: 'Últimas transações' })
    expect(await within(ultimas).findByText('Compra 1')).toBeInTheDocument()
    expect(within(ultimas).getAllByRole('listitem')).toHaveLength(5)
    expect(within(ultimas).queryByText('Compra 6')).not.toBeInTheDocument()
  })

  it('consulta o mês escolhido no seletor global', async () => {
    const fetchMock = rotas()
    renderComRotas(<DashboardPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Próximo mês' }))
    await vi.waitFor(() => {
      const meses = chamadas(fetchMock, 'GET', '/api/resumo/').map(([url]) =>
        new URL(String(url), 'http://localhost').searchParams.get('mes'),
      )
      expect(meses).toEqual(['2026-11', '2026-12'])
    })
  })

  it('o Papo espia o cartão Saldo e troca para preocupado com saldo negativo', async () => {
    rotas()
    const { unmount } = renderComRotas(<DashboardPage />)
    await screen.findByRole('link', { name: /^Saldo de novembro/ })
    expect(personagensNaTela()).toEqual(['papo-espiando'])
    unmount()

    rotas({ ...resumoNovembro, saldo: '-625.39' })
    renderComRotas(<DashboardPage />)
    const saldo = await screen.findByRole('link', { name: /^Saldo de novembro/ })
    expect(personagensNaTela()).toEqual(['papo-preocupado'])
    expect(semNbsp(saldo.textContent)).toContain('− R$ 625,39')
  })

  it('mostra o estado vazio com o Papo na cadeira e o caranguejo, e esconde o Papo do menu', async () => {
    rotas(vazio)
    const { interfaceApp } = renderComRotas(<DashboardPage />)
    expect(await screen.findByRole('heading', { name: 'Nada lançado em novembro. Bora começar?' })).toBeInTheDocument()
    expect(personagensNaTela()).toEqual(['papo-cadeira-acenando', 'caranguejo'])
    expect(interfaceApp.setOcultarPapoDoMenu).toHaveBeenCalledWith(true)
    await userEvent.click(screen.getByRole('button', { name: 'Nova transação' }))
    expect(interfaceApp.abrirTransacao).toHaveBeenCalled()
  })

  it('sem nenhuma categoria, guia em 2 passos com o passo 1 em destaque', async () => {
    rotas(vazio, lista(0), [])
    const { interfaceApp } = renderComRotas(<DashboardPage />)
    const guia = await screen.findByRole('list', { name: 'Primeiros passos' })
    const passos = within(guia).getAllByRole('listitem')
    expect(passos[0]).toHaveTextContent('1. Crie uma categoria')
    expect(passos[1]).toHaveTextContent('2. Lance sua primeira transação')
    expect(passos[0]).toHaveAttribute('aria-current', 'step')
    expect(passos[1]).not.toHaveAttribute('aria-current')
    await userEvent.click(screen.getByRole('button', { name: 'Criar categoria' }))
    expect(interfaceApp.abrirCategoria).toHaveBeenCalled()
    expect(personagensNaTela().length).toBeLessThanOrEqual(2)
  })

  it('com categoria mas sem nenhuma transação, destaca o passo 2', async () => {
    rotas(vazio, lista(0), [{ ...CATEGORIA_USADA, transacoes: 0 }])
    const { interfaceApp } = renderComRotas(<DashboardPage />)
    const guia = await screen.findByRole('list', { name: 'Primeiros passos' })
    const passos = within(guia).getAllByRole('listitem')
    expect(passos[1]).toHaveAttribute('aria-current', 'step')
    expect(passos[0]).toHaveTextContent('feito')
    await userEvent.click(screen.getByRole('button', { name: 'Lançar transação' }))
    expect(interfaceApp.abrirTransacao).toHaveBeenCalled()
  })

  it('organiza o painel em seções verticais, na ordem pedida, cada uma com descrição', async () => {
    rotas()
    renderComRotas(<DashboardPage />)
    await screen.findByRole('heading', { name: 'Resumo de novembro' })
    const titulos = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(titulos).toEqual([
      'Resumo de novembro',
      'Orçamentos de novembro',
      'Como seu saldo evoluiu',
      'Entradas e saídas por dia',
      'Para onde foi o dinheiro',
      'Como você pagou',
      'Seu ano até agora',
      'Últimas transações',
    ])
    for (const descricao of [
      'Quanto entrou, quanto saiu e quanto sobrou.',
      'Quanto você já usou do limite de cada categoria.',
      'Saldo acumulado dia a dia ao longo do mês.',
      'Cada barra é um dia: para cima o que entrou, para baixo o que saiu.',
      'Suas despesas do mês divididas por categoria.',
      'Suas despesas do mês por forma de pagamento.',
      'Compare os meses do ano.',
    ]) {
      expect(screen.getByText(descricao)).toBeInTheDocument()
    }
    expect(within(screen.getByRole('region', { name: 'Últimas transações' })).getByRole('link', { name: /Ver todas/ })).toHaveAttribute(
      'href',
      '/transacoes?mes=2026-11',
    )
  })

  it('todos os gráficos têm eixos rotulados com unidade', async () => {
    rotas()
    renderComRotas(<DashboardPage />)
    await screen.findByRole('img', { name: /Gráfico de barras de 2026/ })
    expect(screen.getByText('Saldo (R$)')).toBeInTheDocument()
    // O cabeçalho da tabela do treemap também diz "Valor (R$)"; aqui contam só os títulos de eixo.
    expect(screen.getAllByText('Valor (R$)', { selector: 'span' })).toHaveLength(2)
    expect(screen.getAllByText('Dia do mês')).toHaveLength(2)
    expect(screen.getByText('Mês de 2026')).toBeInTheDocument()
  })

  it('mostra uma barra de orçamento por categoria com limite', async () => {
    rotas()
    renderComRotas(<DashboardPage />)
    const secao = await screen.findByRole('region', { name: 'Orçamentos de novembro' })
    const barras = await within(secao).findAllByTestId('barra-orcamento')
    expect(barras).toHaveLength(2)
    expect(semNbsp(barras[0].textContent)).toContain('R$ 382,50 de R$ 300,00 (127%)')
    expect(semNbsp(barras[0].textContent)).toContain('Limite ultrapassado em R$ 82,50')
    expect(within(barras[1]).getByText('Dentro do limite')).toBeInTheDocument()
  })

  it('sem categorias com limite, convida a definir em Categorias', async () => {
    rotas(resumoNovembro, lista(0), [CATEGORIA_USADA], [])
    renderComRotas(<DashboardPage />)
    const secao = await screen.findByRole('region', { name: 'Orçamentos de novembro' })
    expect(await within(secao).findByText(/Nenhuma categoria com limite/)).toBeInTheDocument()
    expect(within(secao).getByRole('link', { name: 'Defina limites em Categorias' })).toHaveAttribute('href', '/categorias?mes=2026-11')
  })

  const DICAS: Dica[] = [
    { id: 'orcamento_estourado', tipo: 'alerta', texto: 'Lazer passou do limite em R$ 82,50.', link: '/transacoes?categoria=4&mes=2026-11' },
    { id: 'despesas_cairam', tipo: 'parabens', texto: 'Suas despesas caíram R$ 393,79 em relação a outubro. Boa!', link: null },
  ]

  it('mostra a dica do Papo no balão, com o Papo do cartão Saldo na pose do tipo', async () => {
    rotas(resumoNovembro, lista(0), [CATEGORIA_USADA], ORCAMENTOS, { corpo: DICAS })
    renderComRotas(<DashboardPage />)
    const regiao = await screen.findByRole('region', { name: 'Dicas do Papo' })
    expect(regiao).toHaveTextContent('Lazer passou do limite em R$ 82,50.')
    expect(personagensNaTela()).toEqual(['papo-preocupado'])
    await userEvent.click(within(regiao).getByRole('button', { name: 'Próxima dica (1/2)' }))
    expect(regiao).toHaveTextContent('Suas despesas caíram')
    expect(personagensNaTela()).toEqual(['papo-joinha'])
  })

  it('com saldo negativo, o Papo continua preocupado em qualquer dica', async () => {
    rotas({ ...resumoNovembro, saldo: '-10.00' }, lista(0), [CATEGORIA_USADA], ORCAMENTOS, { corpo: [DICAS[1]] })
    renderComRotas(<DashboardPage />)
    await screen.findByRole('region', { name: 'Dicas do Papo' })
    expect(personagensNaTela()).toEqual(['papo-preocupado'])
  })

  it('erro nas dicas: o balão não aparece e o painel funciona', async () => {
    rotas(resumoNovembro, lista(0), [CATEGORIA_USADA], ORCAMENTOS, { status: 500, corpo: { detail: 'Erro' } })
    renderComRotas(<DashboardPage />)
    expect(await screen.findByRole('link', { name: /^Saldo de novembro/ })).toBeInTheDocument()
    expect(await screen.findAllByTestId('barra-orcamento')).toHaveLength(2)
    expect(screen.queryByRole('region', { name: 'Dicas do Papo' })).not.toBeInTheDocument()
    expect(personagensNaTela()).toEqual(['papo-espiando'])
  })

  it('estado vazio: dica de primeiros passos sem acrescentar personagem', async () => {
    const primeira: Dica = { id: 'primeira_transacao', tipo: 'primeiros_passos', texto: 'Lance sua primeira transação de novembro.', link: null }
    rotas(vazio, lista(0), [CATEGORIA_USADA], [], { corpo: [primeira] })
    renderComRotas(<DashboardPage />)
    const regiao = await screen.findByRole('region', { name: 'Dicas do Papo' })
    expect(regiao).toHaveTextContent('Lance sua primeira transação de novembro.')
    expect(personagensNaTela()).toEqual(['papo-cadeira-acenando', 'caranguejo'])
  })

  it('mostra como as despesas foram pagas, com não informado por último', async () => {
    rotas()
    renderComRotas(<DashboardPage />)
    const secao = await screen.findByRole('region', { name: 'Como você pagou' })
    const itens = within(secao).getAllByRole('listitem')
    expect(itens.map((i) => semNbsp(i.textContent))).toEqual([
      'Cartão de créditoR$ 1.830,00 · 49%',
      'PixR$ 1.500,00 · 40%',
      'Não informadoR$ 381,81 · 10%',
    ])
  })

  it('sem despesas por forma, avisa em texto', async () => {
    rotas({ ...resumoNovembro, despesas_por_forma: [] })
    renderComRotas(<DashboardPage />)
    const secao = await screen.findByRole('region', { name: 'Como você pagou' })
    expect(within(secao).getByText('Nenhuma despesa em novembro.')).toBeInTheDocument()
  })
})
