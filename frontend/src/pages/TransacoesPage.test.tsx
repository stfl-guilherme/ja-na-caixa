import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Categoria, Transacao } from '@/api/types'
import { chamadas, mockFetch, renderComRotas } from '@/test/utils'
import TransacoesPage from './TransacoesPage'

const categorias: Categoria[] = [
  { id: 1, nome: 'Mercado', tipo: 'DESPESA', cor: '#22C55E', transacoes: 1, criado_em: '' },
]
const transacao: Transacao = {
  id: 10,
  categoria: 1,
  categoria_nome: 'Mercado',
  categoria_cor: '#22C55E',
  tipo: 'DESPESA',
  descricao: 'Supermercado',
  valor: '123.45',
  data: '2026-11-10',
  observacao: '',
  criado_em: '',
  atualizado_em: '',
}
const pagina = (results: Transacao[], count = results.length) => ({ count, next: null, previous: null, results })
const semNbsp = (texto: string | null) => (texto ?? '').replace(/ /g, ' ')

function queryDe(url: unknown) {
  return new URL(String(url), 'http://localhost').searchParams
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

  it('lista as transações do mês atual com valor formatado', async () => {
    const fetchMock = mockFetch([
      { caminho: '/api/categorias/', corpo: categorias },
      { caminho: '/api/transacoes/', corpo: pagina([transacao]) },
    ])
    renderComRotas(<TransacoesPage />)
    const linha = (await screen.findByText('Supermercado')).closest('tr')!
    expect(within(linha).getByText('Mercado')).toBeInTheDocument()
    expect(semNbsp(within(linha).getByText(/123,45/).textContent)).toBe('-R$ 123,45')
    expect(within(linha).getByText('10/11/2026')).toBeInTheDocument()
    const [[url]] = chamadas(fetchMock, 'GET', '/api/transacoes/')
    expect(queryDe(url).get('mes')).toBe('2026-11')
  })

  it('troca o mês do filtro', async () => {
    const fetchMock = mockFetch([
      { caminho: '/api/categorias/', corpo: categorias },
      { caminho: '/api/transacoes/', corpo: pagina([]) },
    ])
    renderComRotas(<TransacoesPage />)
    expect(await screen.findByText('novembro de 2026')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    expect(await screen.findByText('outubro de 2026')).toBeInTheDocument()
    await vi.waitFor(() => {
      const meses = chamadas(fetchMock, 'GET', '/api/transacoes/').map(([url]) => queryDe(url).get('mes'))
      expect(meses).toContain('2026-10')
    })
  })

  it('filtra por tipo', async () => {
    const fetchMock = mockFetch([
      { caminho: '/api/categorias/', corpo: categorias },
      { caminho: '/api/transacoes/', corpo: pagina([]) },
    ])
    renderComRotas(<TransacoesPage />)
    await userEvent.selectOptions(await screen.findByLabelText('Tipo'), 'RECEITA')
    await vi.waitFor(() => {
      const tipos = chamadas(fetchMock, 'GET', '/api/transacoes/').map(([url]) => queryDe(url).get('tipo'))
      expect(tipos).toContain('RECEITA')
    })
  })

  it('mostra o estado vazio', async () => {
    mockFetch([
      { caminho: '/api/categorias/', corpo: categorias },
      { caminho: '/api/transacoes/', corpo: pagina([]) },
    ])
    renderComRotas(<TransacoesPage />)
    expect(await screen.findByText('Nenhuma transação encontrada')).toBeInTheDocument()
  })

  it('exclui após confirmação', async () => {
    const fetchMock = mockFetch([
      { caminho: '/api/categorias/', corpo: categorias },
      { caminho: '/api/transacoes/', corpo: pagina([transacao]) },
      { metodo: 'DELETE', caminho: '/api/transacoes/10/', status: 204 },
    ])
    renderComRotas(<TransacoesPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Supermercado' }))
    const dialogo = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Excluir' }))
    await vi.waitFor(() => expect(chamadas(fetchMock, 'DELETE', '/api/transacoes/10/')).toHaveLength(1))
  })

  it('pagina os resultados', async () => {
    const fetchMock = mockFetch([
      { caminho: '/api/categorias/', corpo: categorias },
      { caminho: '/api/transacoes/', corpo: pagina([transacao], 45) },
    ])
    renderComRotas(<TransacoesPage />)
    expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Próxima página' }))
    await vi.waitFor(() => {
      const paginas = chamadas(fetchMock, 'GET', '/api/transacoes/').map(([url]) => queryDe(url).get('page'))
      expect(paginas).toContain('2')
    })
  })
})
