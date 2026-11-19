import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Categoria } from '@/api/types'
import { chamadas, mockFetch, renderComRotas } from '@/test/utils'
import { CategoriaModal } from './CategoriaModal'

const lazer: Categoria = { id: 5, nome: 'Lazer', tipo: 'DESPESA', cor: '#8C6A0C', limite_mensal: '300.00', transacoes: 0, criado_em: '' }

function abrir(categoria?: Categoria) {
  const onSalva = vi.fn()
  renderComRotas(<CategoriaModal aberto categoria={categoria} onFechar={vi.fn()} onSalva={onSalva} />)
  return { dialogo: screen.getByRole('dialog'), onSalva }
}

function corpoEnviado(fetchMock: ReturnType<typeof mockFetch>, metodo: string, caminho: string) {
  const [[, init]] = chamadas(fetchMock, metodo, caminho)
  return JSON.parse(String(init?.body))
}

describe('CategoriaModal — limite mensal', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('mostra o campo só para despesa', async () => {
    mockFetch([])
    const { dialogo } = abrir()
    expect(within(dialogo).getByLabelText(/Limite mensal/)).toBeInTheDocument()
    await userEvent.click(within(dialogo).getByRole('radio', { name: /Receita/ }))
    expect(within(dialogo).queryByLabelText(/Limite mensal/)).not.toBeInTheDocument()
  })

  it('envia o limite digitado no formato da API', async () => {
    const fetchMock = mockFetch([{ metodo: 'POST', caminho: '/api/categorias/', status: 201, corpo: lazer }])
    const { dialogo, onSalva } = abrir()
    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), 'Lazer')
    await userEvent.type(within(dialogo).getByLabelText(/Limite mensal/), '30000')
    expect(within(dialogo).getByLabelText(/Limite mensal/)).toHaveValue('300,00')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))
    await vi.waitFor(() => expect(onSalva).toHaveBeenCalled())
    expect(corpoEnviado(fetchMock, 'POST', '/api/categorias/')).toMatchObject({ tipo: 'DESPESA', limite_mensal: '300.00' })
  })

  it('campo vazio envia sem limite', async () => {
    const fetchMock = mockFetch([{ metodo: 'POST', caminho: '/api/categorias/', status: 201, corpo: lazer }])
    const { dialogo, onSalva } = abrir()
    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), 'Lazer')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))
    await vi.waitFor(() => expect(onSalva).toHaveBeenCalled())
    expect(corpoEnviado(fetchMock, 'POST', '/api/categorias/').limite_mensal).toBeNull()
  })

  it('ao editar, mostra o limite atual e permite apagar', async () => {
    const fetchMock = mockFetch([{ metodo: 'PUT', caminho: '/api/categorias/5/', corpo: lazer }])
    const { dialogo, onSalva } = abrir(lazer)
    const campo = within(dialogo).getByLabelText(/Limite mensal/)
    expect(campo).toHaveValue('300,00')
    await userEvent.clear(campo)
    expect(campo).toHaveValue('')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))
    await vi.waitFor(() => expect(onSalva).toHaveBeenCalled())
    expect(corpoEnviado(fetchMock, 'PUT', '/api/categorias/5/').limite_mensal).toBeNull()
  })

  it('trocar para receita remove o limite no mesmo envio', async () => {
    const fetchMock = mockFetch([{ metodo: 'PUT', caminho: '/api/categorias/5/', corpo: { ...lazer, tipo: 'RECEITA' } }])
    const { dialogo, onSalva } = abrir(lazer)
    await userEvent.click(within(dialogo).getByRole('radio', { name: /Receita/ }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))
    await vi.waitFor(() => expect(onSalva).toHaveBeenCalled())
    expect(corpoEnviado(fetchMock, 'PUT', '/api/categorias/5/')).toMatchObject({ tipo: 'RECEITA', limite_mensal: null })
  })

  it('mostra o erro da API no campo de limite', async () => {
    mockFetch([{ metodo: 'POST', caminho: '/api/categorias/', status: 400, corpo: { limite_mensal: ['O limite deve ser maior que zero.'] } }])
    const { dialogo } = abrir()
    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), 'Lazer')
    await userEvent.type(within(dialogo).getByLabelText(/Limite mensal/), '1')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))
    expect(await within(dialogo).findByText('O limite deve ser maior que zero.')).toBeInTheDocument()
    expect(within(dialogo).getByLabelText(/Limite mensal/)).toHaveAttribute('aria-invalid', 'true')
  })
})
