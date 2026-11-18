import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Resumo, Transacao } from '@/api/types'
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

function rotas(resumo: Resumo = resumoNovembro, transacoes = lista(0)) {
  return mockFetch([
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
    expect(screen.getByRole('img', { name: /Gráfico espelhado/ })).toBeInTheDocument()
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
})
