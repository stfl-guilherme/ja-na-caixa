import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { chamadas, mockFetch, personagensNaTela, renderComRotas } from '@/test/utils'
import LoginPage from './LoginPage'

const extras = { '/': <p>Página inicial</p> }

describe('LoginPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('exibe o nome, o título e o Papo acenando na cadeira', () => {
    mockFetch([])
    renderComRotas(<LoginPage />, { caminho: '/login', rota: '/login', extras })
    expect(screen.getAllByText((_, el) => el?.textContent === 'JáNaCaixa' && el.tagName === 'P').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Entre na sua conta' })).toBeInTheDocument()
    expect(personagensNaTela()).toContain('papo-cadeira-acenando')
  })

  it('mostra o estado de carregando com o Papo animado', async () => {
    let liberar: (r: Response) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((resolve) => (liberar = resolve))),
    )
    document.cookie = 'csrftoken=teste; path=/'
    renderComRotas(<LoginPage />, { caminho: '/login', rota: '/login', extras })
    await userEvent.type(screen.getByLabelText('Usuário'), 'ana')
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('button', { name: /Entrando/ })).toBeDisabled()
    expect(screen.getByLabelText('Usuário')).toBeDisabled()
    expect(screen.getByLabelText('Senha')).toBeDisabled()
    expect(screen.getByRole('button', { name: /Entrar como demonstração/ })).toBeDisabled()
    expect(personagensNaTela()).toContain('papo-animado')
    liberar(new Response(null, { status: 401 }))
  })

  it('mostra e oculta a senha', async () => {
    mockFetch([])
    renderComRotas(<LoginPage />, { caminho: '/login', rota: '/login', extras })
    const senha = screen.getByLabelText('Senha')
    expect(senha).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(senha).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('entra como demonstração e redireciona para o dashboard', async () => {
    const fetchMock = mockFetch([
      { metodo: 'POST', caminho: '/api/auth/demo/', corpo: { id: 1, username: 'demo' } },
    ])
    renderComRotas(<LoginPage />, { caminho: '/login', rota: '/login', extras })

    await userEvent.click(screen.getByRole('button', { name: /Entrar como demonstração/ }))

    expect(await screen.findByText('Página inicial')).toBeInTheDocument()
    expect(chamadas(fetchMock, 'POST', '/api/auth/demo/')).toHaveLength(1)
  })

  it('faz login com usuário e senha', async () => {
    const fetchMock = mockFetch([
      { metodo: 'POST', caminho: '/api/auth/login/', corpo: { id: 2, username: 'ana' } },
    ])
    renderComRotas(<LoginPage />, { caminho: '/login', rota: '/login', extras })

    await userEvent.type(screen.getByLabelText('Usuário'), 'ana')
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Página inicial')).toBeInTheDocument()
    const [[, init]] = chamadas(fetchMock, 'POST', '/api/auth/login/')
    expect(JSON.parse(String(init?.body))).toEqual({ username: 'ana', password: 'segredo' })
  })

  it('mostra a mensagem de credenciais inválidas', async () => {
    mockFetch([
      { metodo: 'POST', caminho: '/api/auth/login/', status: 400, corpo: { detail: 'Usuário ou senha inválidos.' } },
    ])
    renderComRotas(<LoginPage />, { caminho: '/login', rota: '/login', extras })

    await userEvent.type(screen.getByLabelText('Usuário'), 'ana')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário ou senha inválidos')
    expect(screen.queryByText('Página inicial')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Usuário')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Usuário')).toHaveAccessibleDescription(/Usuário ou senha inválidos/)
    expect(personagensNaTela()).toContain('papo-preocupado')
  })

  it('mostra o erro quando o demo não está disponível', async () => {
    mockFetch([
      {
        metodo: 'POST',
        caminho: '/api/auth/demo/',
        status: 503,
        corpo: { detail: 'Usuário de demonstração não encontrado. Rode: python manage.py seed_demo' },
      },
    ])
    renderComRotas(<LoginPage />, { caminho: '/login', rota: '/login', extras })
    await userEvent.click(screen.getByRole('button', { name: /Entrar como demonstração/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('seed_demo')
  })

  it('redireciona para o dashboard quem já está logado', async () => {
    mockFetch([{ caminho: '/api/auth/me/', corpo: { id: 1, username: 'demo' } }])
    renderComRotas(<LoginPage />, { caminho: '/login', rota: '/login', extras })
    expect(await screen.findByText('Página inicial')).toBeInTheDocument()
  })
})
