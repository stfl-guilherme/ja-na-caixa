import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Categoria, ListaTransacoes, Transacao } from '@/api/types'
import { chamadas, mockFetch, personagensNaTela, renderComRotas } from '@/test/utils'
import TransacoesPage from './TransacoesPage'

const categorias: Categoria[] = [
  { id: 1, nome: 'Mercado', tipo: 'DESPESA', cor: '#B5541A', limite_mensal: null, transacoes: 1, criado_em: '' },
  { id: 2, nome: 'Salário', tipo: 'RECEITA', cor: '#2F7D35', limite_mensal: null, transacoes: 1, criado_em: '' },
]
const transacao: Transacao = {
  id: 10,
  categoria: 1,
  categoria_nome: 'Mercado',
  categoria_cor: '#B5541A',
  tipo: 'DESPESA',
  descricao: 'Supermercado',
  valor: '123.45',
  data: '2026-11-10',
  observacao: 'Compra do mês',
  forma_pagamento: 'NAO_INFORMADO',
  forma_pagamento_rotulo: 'Não informado',
  criado_em: '',
  atualizado_em: '',
}
const pagina = (results: Transacao[], count = results.length): ListaTransacoes => ({
  count,
  next: null,
  previous: null,
  results,
  totais: { receitas: '5200.00', despesas: '123.45', saldo: '5076.55' },
  totais_por_dia: [{ data: '2026-11-10', saldo: '-123.45' }],
})
const semNbsp = (texto: string | null) => (texto ?? '').replace(/ /g, ' ')
const queryDe = (url: unknown) => new URL(String(url), 'http://localhost').searchParams
const parametros = (fetchMock: ReturnType<typeof mockFetch>, nome: string) =>
  chamadas(fetchMock, 'GET', '/api/transacoes/').map(([url]) => queryDe(url).get(nome))

function rotas(lista: ListaTransacoes = pagina([transacao])) {
  return mockFetch([
    { caminho: '/api/categorias/', corpo: categorias },
    { caminho: '/api/transacoes/', corpo: lista },
  ])
}

describe('TransacoesPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 17))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('lista as transações do mês com valor, categoria, data e observação', async () => {
    const fetchMock = rotas()
    renderComRotas(<TransacoesPage />)
    const linha = (await screen.findByText('Supermercado')).closest('[role="row"]') as HTMLElement
    expect(within(linha).getByText('Mercado')).toBeInTheDocument()
    expect(within(linha).getByText('Compra do mês')).toBeInTheDocument()
    expect(semNbsp(within(linha).getByText(/123,45/).textContent)).toBe('− R$ 123,45')
    expect(within(linha).getByText('10/11/2026')).toBeInTheDocument()
    expect(parametros(fetchMock, 'mes')[0]).toBe('2026-11')
  })

  it('mostra os totais do filtro vindos da API', async () => {
    rotas()
    renderComRotas(<TransacoesPage />)
    expect(semNbsp((await screen.findByTestId('resumo-filtro')).textContent)).toBe(
      '1 transação · Receitas + R$ 5.200,00 · Despesas − R$ 123,45',
    )
  })

  it('troca o mês pelo seletor global', async () => {
    const fetchMock = rotas()
    renderComRotas(<TransacoesPage />)
    expect(await screen.findByText('Novembro 2026')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    expect(await screen.findByText('Outubro 2026')).toBeInTheDocument()
    await vi.waitFor(() => expect(parametros(fetchMock, 'mes')).toContain('2026-10'))
  })

  it('filtra por tipo com os botões segmentados', async () => {
    const fetchMock = rotas()
    renderComRotas(<TransacoesPage />)
    const receitas = await screen.findByRole('button', { name: 'Receitas' })
    await userEvent.click(receitas)
    expect(receitas).toHaveAttribute('aria-pressed', 'true')
    await vi.waitFor(() => expect(parametros(fetchMock, 'tipo')).toContain('RECEITA'))
  })

  it('aceita o tipo vindo da URL (cartão do Painel)', async () => {
    const fetchMock = rotas()
    renderComRotas(<TransacoesPage />, { caminho: '/transacoes?mes=2026-11&tipo=DESPESA' })
    expect(await screen.findByRole('button', { name: 'Despesas' })).toHaveAttribute('aria-pressed', 'true')
    expect(parametros(fetchMock, 'tipo')[0]).toBe('DESPESA')
  })

  it('filtra por categoria e limpa os filtros', async () => {
    const fetchMock = rotas()
    renderComRotas(<TransacoesPage />)
    await screen.findByRole('option', { name: 'Salário' })
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), '2')
    await vi.waitFor(() => expect(parametros(fetchMock, 'categoria')).toContain('2'))
    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(screen.getByLabelText('Categoria')).toHaveValue('')
  })

  it('o Papo espia os filtros', async () => {
    rotas()
    renderComRotas(<TransacoesPage />)
    await screen.findByText('Supermercado')
    expect(personagensNaTela()).toEqual(['papo-espiando'])
  })

  it('mostra o estado vazio com o Papo de lado e a gaivota', async () => {
    rotas(pagina([]))
    const { interfaceApp } = renderComRotas(<TransacoesPage />, { caminho: '/transacoes?mes=2026-11&tipo=RECEITA' })
    expect(await screen.findByRole('heading', { name: 'Nenhuma transação encontrada com esses filtros.' })).toBeInTheDocument()
    expect(personagensNaTela()).toEqual(['papo-espiando-lado', 'gaivota'])
    expect(interfaceApp.setOcultarPapoDoMenu).toHaveBeenCalledWith(true)
  })

  it('editar e excluir usam o modal e a confirmação do layout', async () => {
    rotas()
    const { interfaceApp } = renderComRotas(<TransacoesPage />)
    await userEvent.click(await screen.findByRole('button', { name: /^Editar Supermercado/ }))
    expect(interfaceApp.abrirTransacao).toHaveBeenCalledWith(transacao)
    await userEvent.click(screen.getByRole('button', { name: /^Excluir Supermercado/ }))
    expect(interfaceApp.pedirExclusao).toHaveBeenCalledWith(transacao)
  })

  it('pagina os resultados', async () => {
    const fetchMock = rotas(pagina([transacao], 45))
    renderComRotas(<TransacoesPage />)
    expect(await screen.findByText('Mostrando 1–20 de 45')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(screen.getByRole('button', { name: 'Próxima página' }))
    await vi.waitFor(() => expect(parametros(fetchMock, 'page')).toContain('2'))
  })

  it('mostra a forma de pagamento na tabela e filtra por ela', async () => {
    const fetchMock = rotas(pagina([{ ...transacao, forma_pagamento: 'PIX', forma_pagamento_rotulo: 'Pix' }]))
    renderComRotas(<TransacoesPage />)
    const linha = (await screen.findByText('Supermercado')).closest('[role="row"]') as HTMLElement
    expect(within(linha).getByText('Pix')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Forma' })).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Forma de pagamento'), 'CARTAO_CREDITO')
    await vi.waitFor(() => expect(parametros(fetchMock, 'forma_pagamento')).toContain('CARTAO_CREDITO'))
  })
})
