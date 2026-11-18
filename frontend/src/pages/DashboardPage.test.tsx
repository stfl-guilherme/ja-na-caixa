import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Resumo, Transacao } from '@/api/types'
import { chamadas, mockFetch, renderComRotas } from '@/test/utils'
import DashboardPage from './DashboardPage'

const semNbsp = (texto: string | null) => (texto ?? '').replace(/ /g, ' ')

const resumo: Resumo = {
  mes: '2026-11',
  receitas: '4500.00',
  despesas: '2310.45',
  saldo: '2189.55',
  por_categoria: [
    { categoria_id: 1, nome: 'Salário', cor: '#16A34A', tipo: 'RECEITA', total: '4500.00', quantidade: 1 },
    { categoria_id: 2, nome: 'Lazer', cor: '#A855F7', tipo: 'DESPESA', total: '1390.15', quantidade: 1 },
    { categoria_id: 3, nome: 'Mercado', cor: '#22C55E', tipo: 'DESPESA', total: '920.30', quantidade: 2 },
  ],
  mes_anterior: { mes: '2026-10', receitas: '4000.00', despesas: '2000.00', saldo: '2000.00' },
  serie_diaria: [],
}

function transacao(id: number): Transacao {
  return {
    id,
    categoria: 3,
    categoria_nome: 'Mercado',
    categoria_cor: '#22C55E',
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
})

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 17))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('mostra receitas, despesas e saldo vindos do resumo', async () => {
    mockFetch([
      { caminho: '/api/resumo/', corpo: resumo },
      { caminho: '/api/transacoes/', corpo: lista(0) },
    ])
    renderComRotas(<DashboardPage />)
    const receitas = await screen.findByRole('region', { name: 'Receitas' })
    await vi.waitFor(() => expect(semNbsp(receitas.textContent)).toContain('R$ 4.500,00'))
    expect(semNbsp(screen.getByRole('region', { name: 'Despesas' }).textContent)).toContain('R$ 2.310,45')
    expect(semNbsp(screen.getByRole('region', { name: 'Saldo' }).textContent)).toContain('R$ 2.189,55')
  })

  it('lista somente despesas no gráfico por categoria', async () => {
    mockFetch([
      { caminho: '/api/resumo/', corpo: resumo },
      { caminho: '/api/transacoes/', corpo: lista(0) },
    ])
    renderComRotas(<DashboardPage />)
    const grafico = await screen.findByRole('region', { name: 'Despesas por categoria' })
    expect(await within(grafico).findByText('Lazer')).toBeInTheDocument()
    expect(within(grafico).getByText('Mercado')).toBeInTheDocument()
    expect(within(grafico).queryByText('Salário')).not.toBeInTheDocument()
  })

  it('mostra as 5 últimas transações do mês', async () => {
    mockFetch([
      { caminho: '/api/resumo/', corpo: resumo },
      { caminho: '/api/transacoes/', corpo: lista(8) },
    ])
    renderComRotas(<DashboardPage />)
    const ultimas = await screen.findByRole('region', { name: 'Últimas transações' })
    expect(await within(ultimas).findByText('Compra 1')).toBeInTheDocument()
    expect(within(ultimas).getAllByRole('listitem')).toHaveLength(5)
    expect(within(ultimas).queryByText('Compra 6')).not.toBeInTheDocument()
  })

  it('consulta o mês escolhido', async () => {
    const fetchMock = mockFetch([
      { caminho: '/api/resumo/', corpo: resumo },
      { caminho: '/api/transacoes/', corpo: lista(0) },
    ])
    renderComRotas(<DashboardPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Próximo mês' }))
    await vi.waitFor(() => {
      const meses = chamadas(fetchMock, 'GET', '/api/resumo/').map(([url]) =>
        new URL(String(url), 'http://localhost').searchParams.get('mes'),
      )
      expect(meses).toEqual(['2026-11', '2026-12'])
    })
  })

  it('mostra estados vazios quando o mês não tem movimento', async () => {
    mockFetch([
      { caminho: '/api/resumo/', corpo: { ...resumo, receitas: '0.00', despesas: '0.00', saldo: '0.00', por_categoria: [] } },
      { caminho: '/api/transacoes/', corpo: lista(0) },
    ])
    renderComRotas(<DashboardPage />)
    expect(await screen.findByText('Nenhuma despesa neste mês.')).toBeInTheDocument()
    expect(await screen.findByText('Nenhuma transação neste mês.')).toBeInTheDocument()
  })
})
