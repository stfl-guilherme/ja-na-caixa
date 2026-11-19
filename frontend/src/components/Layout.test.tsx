import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useOcultarPapoDoMenu } from '@/components/layout/contexto'
import { chamadas, mockFetch, personagensNaTela, renderComRotas } from '@/test/utils'
import { Layout } from './Layout'
import { ProtectedRoute } from './ProtectedRoute'

const extras = { '/login': <p>Tela de login</p> }
const ME = { caminho: '/api/auth/me/', corpo: { id: 1, username: 'demo' } }
const CATEGORIAS = {
  caminho: '/api/categorias/',
  corpo: [{ id: 1, nome: 'Mercado', tipo: 'DESPESA', cor: '#B5541A', limite_mensal: null, transacoes: 0, criado_em: '' }],
}

function Local() {
  const { pathname, search } = useLocation()
  return <p data-testid="local">{pathname + search}</p>
}

function PaginaComVazio() {
  useOcultarPapoDoMenu(true)
  return <p>Estado vazio</p>
}

function arvore() {
  return (
    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route
          index
          element={
            <>
              <p>Conteúdo do painel</p>
              <Local />
            </>
          }
        />
        <Route path="transacoes" element={<Local />} />
        <Route path="vazio" element={<PaginaComVazio />} />
      </Route>
    </Route>
  )
}

function renderLayout(caminho = '/') {
  return renderComRotas(<></>, { caminho, rota: '/__nada', extras, filhos: arvore() })
}

describe('rotas protegidas', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sem sessão redireciona para /login', async () => {
    mockFetch([{ caminho: '/api/auth/me/', status: 401, corpo: { detail: 'Não autenticado.' } }])
    renderComRotas(<ProtectedRoute />, { caminho: '/', rota: '/', extras })
    expect(await screen.findByText('Tela de login')).toBeInTheDocument()
  })

  it('com sessão mostra o nome, o menu, o usuário e o conteúdo', async () => {
    mockFetch([ME, CATEGORIAS])
    renderLayout()
    expect(await screen.findByText('Conteúdo do painel')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'JáNaCaixa, ir para o Painel' })).toBeInTheDocument()
    const menu = screen.getByRole('navigation', { name: 'Menu principal' })
    expect(within(menu).getByRole('link', { name: 'Painel' })).toHaveAttribute('aria-current', 'page')
    expect(within(menu).getByRole('link', { name: 'Transações' })).toBeInTheDocument()
    expect(within(menu).getByRole('link', { name: 'Categorias' })).toBeInTheDocument()
    expect(screen.getByText('demo')).toBeInTheDocument()
  })

  it('sair encerra a sessão e volta para o login', async () => {
    const fetchMock = mockFetch([ME, CATEGORIAS, { metodo: 'POST', caminho: '/api/auth/logout/', status: 204 }])
    renderLayout()
    await userEvent.click(await screen.findByRole('button', { name: /sair/i }))
    expect(await screen.findByText('Tela de login')).toBeInTheDocument()
    expect(chamadas(fetchMock, 'POST', '/api/auth/logout/')).toHaveLength(1)
  })
})

describe('layout do novo design', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('"Nova transação" abre o modal a partir de qualquer tela', async () => {
    mockFetch([ME, CATEGORIAS])
    renderLayout('/transacoes?mes=2026-11')
    await userEvent.click(await screen.findByRole('button', { name: 'Nova transação' }))
    expect(await screen.findByRole('dialog', { name: 'Nova transação' })).toBeInTheDocument()
  })

  it('os links do menu carregam o mês escolhido', async () => {
    mockFetch([ME, CATEGORIAS])
    renderLayout('/?mes=2026-09')
    const menu = await screen.findByRole('navigation', { name: 'Menu principal' })
    expect(within(menu).getByRole('link', { name: 'Transações' })).toHaveAttribute('href', '/transacoes?mes=2026-09')
    expect(within(menu).getByRole('link', { name: 'Categorias' })).toHaveAttribute('href', '/categorias?mes=2026-09')
  })

  it('mostra o Papo espiando no menu e o esconde quando a página já tem 2 personagens', async () => {
    mockFetch([ME, CATEGORIAS])
    const { unmount } = renderLayout()
    await screen.findByText('Conteúdo do painel')
    expect(personagensNaTela()).toEqual(['papo-espiando'])
    unmount()
    renderLayout('/vazio')
    await screen.findByText('Estado vazio')
    expect(personagensNaTela()).toEqual([])
  })
})
