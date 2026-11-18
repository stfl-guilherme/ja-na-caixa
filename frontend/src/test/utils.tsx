import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'

export function criarQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
}

/** Renderiza `ui` na rota `caminho`, com rotas auxiliares para checar redirecionamentos. */
export function renderComRotas(
  ui: ReactElement,
  {
    caminho = '/',
    rota = '*',
    extras = {},
    filhos,
  }: { caminho?: string; rota?: string; extras?: Record<string, ReactElement>; filhos?: ReactNode } = {},
) {
  const queryClient = criarQueryClient()
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[caminho]}>
          <Routes>
            <Route path={rota} element={ui} />
            {filhos}
            {Object.entries(extras).map(([path, elemento]) => (
              <Route key={path} path={path} element={elemento} />
            ))}
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  }
}

export function respostaJson(status: number, corpo?: unknown) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: corpo === undefined ? {} : { 'Content-Type': 'application/json' },
  })
}

type Rota = { metodo?: string; caminho: string | RegExp; status?: number; corpo?: unknown }

/**
 * Substitui o fetch global por um roteador simples de respostas falsas.
 * Rotas não mapeadas falham o teste com uma mensagem clara.
 */
export function mockFetch(rotas: Rota[]) {
  document.cookie = 'csrftoken=teste; path=/'
  const fetchMock = vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = String(entrada)
    const metodo = init?.method ?? 'GET'
    const rota = rotas.find(
      (r) =>
        (r.metodo ?? 'GET') === metodo &&
        (typeof r.caminho === 'string' ? url.split('?')[0] === r.caminho : r.caminho.test(url)),
    )
    if (!rota) throw new Error(`Requisição não mapeada no teste: ${metodo} ${url}`)
    return respostaJson(rota.status ?? 200, rota.corpo)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export function chamadas(fetchMock: ReturnType<typeof mockFetch>, metodo: string, caminho: string) {
  return fetchMock.mock.calls.filter(
    ([url, init]) => (init?.method ?? 'GET') === metodo && String(url).split('?')[0] === caminho,
  )
}
