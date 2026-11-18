import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { chamadas, mockFetch, renderComRotas } from '@/test/utils'
import { Layout } from './Layout'
import { ProtectedRoute } from './ProtectedRoute'

const extras = { '/login': <p>Tela de login</p> }

function arvore() {
  return (
    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route index element={<p>Conteúdo do dashboard</p>} />
      </Route>
    </Route>
  )
}

describe('rotas protegidas', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sem sessão redireciona para /login', async () => {
    mockFetch([{ caminho: '/api/auth/me/', status: 401, corpo: { detail: 'Não autenticado.' } }])
    renderComRotas(<ProtectedRoute />, { caminho: '/', rota: '/', extras })
    expect(await screen.findByText('Tela de login')).toBeInTheDocument()
  })

  it('com sessão mostra o cabeçalho, o menu e o conteúdo', async () => {
    mockFetch([{ caminho: '/api/auth/me/', corpo: { id: 1, username: 'demo' } }])
    renderComRotas(<></>, { caminho: '/', rota: '/__nada', extras, filhos: arvore() })
    expect(await screen.findByText('Conteúdo do dashboard')).toBeInTheDocument()
    expect(screen.getByText('JáNaCaixa')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /dashboard/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /transações/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /categorias/i }).length).toBeGreaterThan(0)
    expect(screen.getByText('demo')).toBeInTheDocument()
  })

  it('sair encerra a sessão e volta para o login', async () => {
    const fetchMock = mockFetch([
      { caminho: '/api/auth/me/', corpo: { id: 1, username: 'demo' } },
      { metodo: 'POST', caminho: '/api/auth/logout/', status: 204 },
    ])
    renderComRotas(<></>, { caminho: '/', rota: '/__nada', extras, filhos: arvore() })
    await userEvent.click(await screen.findByRole('button', { name: /sair/i }))
    expect(await screen.findByText('Tela de login')).toBeInTheDocument()
    expect(chamadas(fetchMock, 'POST', '/api/auth/logout/')).toHaveLength(1)
  })
})
