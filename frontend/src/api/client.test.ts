import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError } from './client'

function respostaJson(status: number, corpo?: unknown) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: corpo === undefined ? {} : { 'Content-Type': 'application/json' },
  })
}

async function falha(promessa: Promise<unknown>): Promise<ApiError> {
  try {
    await promessa
  } catch (erro) {
    return erro as ApiError
  }
  throw new Error('a requisição deveria ter falhado')
}

function limparCookies() {
  document.cookie.split(';').forEach((c) => {
    const nome = c.split('=')[0].trim()
    if (nome) document.cookie = `${nome}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  })
}

describe('api', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    limparCookies()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('faz GET com query string e devolve o JSON', async () => {
    fetchMock.mockResolvedValueOnce(respostaJson(200, [{ id: 1 }]))
    const dados = await api<{ id: number }[]>('/categorias/', { params: { tipo: 'DESPESA', vazio: '' } })
    expect(dados).toEqual([{ id: 1 }])
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/categorias/?tipo=DESPESA')
    expect(init.method).toBe('GET')
    expect(init.credentials).toBe('same-origin')
  })

  it('envia X-CSRFToken lido do cookie em POST', async () => {
    document.cookie = 'csrftoken=abc123; path=/'
    fetchMock.mockResolvedValueOnce(respostaJson(201, { id: 9 }))
    await api('/categorias/', { method: 'POST', body: { nome: 'X' } })
    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers['X-CSRFToken']).toBe('abc123')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.body).toBe(JSON.stringify({ nome: 'X' }))
  })

  it('busca o cookie de CSRF antes do primeiro POST quando ele não existe', async () => {
    fetchMock.mockImplementationOnce(async () => {
      document.cookie = 'csrftoken=novo; path=/'
      return respostaJson(204)
    })
    fetchMock.mockResolvedValueOnce(respostaJson(200, { id: 1, username: 'demo' }))
    await api('/auth/demo/', { method: 'POST' })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/csrf/')
    expect(fetchMock.mock.calls[1][1].headers['X-CSRFToken']).toBe('novo')
  })

  it('devolve undefined em 204', async () => {
    document.cookie = 'csrftoken=abc; path=/'
    fetchMock.mockResolvedValueOnce(respostaJson(204))
    await expect(api('/categorias/1/', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('converte 400 em ApiError com erros por campo', async () => {
    document.cookie = 'csrftoken=abc; path=/'
    fetchMock.mockResolvedValueOnce(respostaJson(400, { valor: ['O valor deve ser maior que zero.'] }))
    const erro = await falha(api('/transacoes/', { method: 'POST', body: {} }))
    expect(erro).toBeInstanceOf(ApiError)
    expect(erro.status).toBe(400)
    expect(erro.fieldErrors).toEqual({ valor: ['O valor deve ser maior que zero.'] })
  })

  it('converte 401 em ApiError com a mensagem do detail', async () => {
    fetchMock.mockResolvedValueOnce(respostaJson(401, { detail: 'As credenciais não foram fornecidas.' }))
    const erro = await falha(api('/auth/me/'))
    expect(erro).toBeInstanceOf(ApiError)
    expect(erro.status).toBe(401)
    expect(erro.message).toBe('As credenciais não foram fornecidas.')
  })

  it('mantém o corpo completo do erro (ex.: 409 com número de transações)', async () => {
    document.cookie = 'csrftoken=abc; path=/'
    fetchMock.mockResolvedValueOnce(respostaJson(409, { detail: 'Em uso.', transacoes: 3 }))
    const erro = await falha(api('/categorias/1/', { method: 'DELETE' }))
    expect(erro.status).toBe(409)
    expect(erro.body).toEqual({ detail: 'Em uso.', transacoes: 3 })
  })

  it('usa mensagem genérica quando o servidor não responde JSON', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>erro</html>', { status: 500 }))
    const erro = await falha(api('/resumo/'))
    expect(erro.status).toBe(500)
    expect(erro.message).toMatch(/erro inesperado/i)
  })
})
