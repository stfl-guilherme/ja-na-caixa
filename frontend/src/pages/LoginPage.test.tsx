import { screen, within } from '@testing-library/react'
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

  it('"Entrar como demonstração" abre a escolha com foco na primeira opção', async () => {
    mockFetch([])
    renderComRotas(<LoginPage />, { caminho: '/login', rota: '/login', extras })
    await userEvent.click(screen.getByRole('button', { name: /Entrar como demonstração/ }))
    const escolha = screen.getByRole('group', { name: 'Como você quer entrar na demonstração?' })
    const exemplo = within(escolha).getByRole('button', { name: /Ver com dados de exemplo/ })
    expect(exemplo).toHaveFocus()
    expect(within(escolha).getByRole('button', { name: /Começar do zero/ })).toBeInTheDocument()
    expect(screen.getByText('Os dados de demonstração são recriados a cada entrada.')).toBeInTheDocument()
  })

  it.each([
    ['Ver com dados de exemplo', 'exemplo'],
    ['Começar do zero', 'vazio'],
  ])('a opção "%s" entra no modo %s e redireciona para o painel', async (rotulo, modo) => {
    const fetchMock = mockFetch([
      { metodo: 'POST', caminho: '/api/auth/demo/', corpo: { id: 1, username: modo === 'vazio' ? 'demo-vazio' : 'demo' } },
    ])
    renderComRotas(<LoginPage />, { caminho: '/login', rota: '/login', extras })
    await userEvent.click(screen.getByRole('button', { name: /Entrar como demonstração/ }))
    await userEvent.click(screen.getByRole('button', { name: new RegExp(rotulo) }))
    expect(await screen.findByText('Página inicial')).toBeInTheDocument()
    const [[, init]] = chamadas(fetchMock, 'POST', '/api/auth/demo/')
    expect(JSON.parse(String(init?.body))).toEqual({ modo })
  })

  it('"Voltar" fecha a escolha e devolve o foco ao botão de demonstração', async () => {
    mockFetch([])
    renderComRotas(<LoginPage />, { caminho: '/login', rota: '/login', extras })
    await userEvent.click(screen.getByRole('button', { name: /Entrar como demonstração/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(screen.queryByRole('group', { name: /demonstração/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Entrar como demonstração/ })).toHaveFocus()
  })

  it('é navegável por teclado e mostra carregando na opção escolhida', async () => {
    let liberar: (r: Response) => void = () => {}
    document.cookie = 'csrftoken=teste; path=/'
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => (liberar = resolve))))
    renderComRotas(<LoginPage />, { caminho: '/login', rota: '/login', extras })
    screen.getByRole('button', { name: /Entrar como demonstração/ }).focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.tab()
    expect(screen.getByRole('button', { name: /Começar do zero/ })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    const zero = await screen.findByRole('button', { name: /Começar do zero/ })
    expect(zero).toHaveAttribute('aria-busy', 'true')
    expect(zero).toHaveTextContent('Entrando…')
    expect(screen.getByRole('button', { name: /Ver com dados de exemplo/ })).toBeDisabled()
    expect(personagensNaTela()).toContain('papo-animado')
    liberar(new Response(null, { status: 401 }))
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
        corpo: { detail: 'Demonstração indisponível.' },
      },
    ])
    renderComRotas(<LoginPage />, { caminho: '/login', rota: '/login', extras })
    await userEvent.click(screen.getByRole('button', { name: /Entrar como demonstração/ }))
    await userEvent.click(screen.getByRole('button', { name: /Ver com dados de exemplo/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Demonstração indisponível')
  })

  it('redireciona para o dashboard quem já está logado', async () => {
    mockFetch([{ caminho: '/api/auth/me/', corpo: { id: 1, username: 'demo' } }])
    renderComRotas(<LoginPage />, { caminho: '/login', rota: '/login', extras })
    expect(await screen.findByText('Página inicial')).toBeInTheDocument()
  })
})
