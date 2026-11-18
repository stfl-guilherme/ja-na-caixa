// Cliente HTTP da API. Sessão do Django + CSRF via proxy do Vite (ADR-002).

const BASE = '/api'
const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS'])

export type FieldErrors = Record<string, string[]>

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown
  readonly fieldErrors: FieldErrors

  constructor(status: number, message: string, body: unknown, fieldErrors: FieldErrors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    this.fieldErrors = fieldErrors
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface OpcoesRequisicao {
  method?: Metodo
  body?: unknown
  params?: Record<string, string | number | undefined | null>
}

function lerCookie(nome: string): string | null {
  const par = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${nome}=`))
  return par ? decodeURIComponent(par.slice(nome.length + 1)) : null
}

async function garantirCsrf(): Promise<string> {
  let token = lerCookie('csrftoken')
  if (!token) {
    await fetch(`${BASE}/auth/csrf/`, { method: 'GET', credentials: 'same-origin' })
    token = lerCookie('csrftoken')
  }
  return token ?? ''
}

function montarUrl(path: string, params?: OpcoesRequisicao['params']): string {
  const busca = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') busca.set(chave, String(valor))
  })
  const query = busca.toString()
  return `${BASE}${path}${query ? `?${query}` : ''}`
}

function extrairErros(corpo: unknown): { mensagem: string | null; campos: FieldErrors } {
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
    return { mensagem: null, campos: {} }
  }
  const campos: FieldErrors = {}
  let mensagem: string | null = null
  for (const [chave, valor] of Object.entries(corpo as Record<string, unknown>)) {
    if (chave === 'detail' && typeof valor === 'string') {
      mensagem = valor
    } else if (Array.isArray(valor) && valor.every((v) => typeof v === 'string')) {
      campos[chave] = valor as string[]
    }
  }
  if (!mensagem && campos.non_field_errors) mensagem = campos.non_field_errors[0]
  return { mensagem, campos }
}

export async function api<T = unknown>(path: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
  const method = opcoes.method ?? 'GET'
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (!METODOS_SEGUROS.has(method)) {
    headers['X-CSRFToken'] = await garantirCsrf()
  }
  let body: string | undefined
  if (opcoes.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opcoes.body)
  }

  const resposta = await fetch(montarUrl(path, opcoes.params), {
    method,
    headers,
    body,
    credentials: 'same-origin',
  })

  if (resposta.status === 204) return undefined as T

  const tipo = resposta.headers.get('Content-Type') ?? ''
  const corpo: unknown = tipo.includes('application/json') ? await resposta.json() : null

  if (!resposta.ok) {
    const { mensagem, campos } = extrairErros(corpo)
    throw new ApiError(
      resposta.status,
      mensagem ?? (Object.keys(campos).length ? 'Verifique os campos destacados.' : 'Ocorreu um erro inesperado. Tente novamente.'),
      corpo,
      campos,
    )
  }
  return corpo as T
}
