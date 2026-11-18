import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockFetch } from '@/test/utils'
import App from './App'

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    window.history.pushState({}, '', '/')
  })

  it('sem sessão abre a tela de login com o nome JáNaCaixa', async () => {
    mockFetch([{ caminho: '/api/auth/me/', status: 401, corpo: { detail: 'Não autenticado.' } }])
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'JáNaCaixa' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar como demonstração' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })
})
