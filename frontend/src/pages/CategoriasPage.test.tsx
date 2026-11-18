import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Categoria } from '@/api/types'
import { chamadas, mockFetch, renderComRotas } from '@/test/utils'
import CategoriasPage from './CategoriasPage'

const mercado: Categoria = {
  id: 1,
  nome: 'Mercado',
  tipo: 'DESPESA',
  cor: '#22C55E',
  transacoes: 3,
  criado_em: '2026-11-17T10:00:00Z',
}
const salario: Categoria = { ...mercado, id: 2, nome: 'Salário', tipo: 'RECEITA', transacoes: 0 }

describe('CategoriasPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('lista as categorias separadas por tipo', async () => {
    mockFetch([{ caminho: '/api/categorias/', corpo: [mercado, salario] }])
    renderComRotas(<CategoriasPage />)
    expect(await screen.findByText('Mercado')).toBeInTheDocument()
    expect(screen.getByText('Salário')).toBeInTheDocument()
    expect(screen.getByText('3 transações')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Receitas' })).getByText('Salário')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Despesas' })).getByText('Mercado')).toBeInTheDocument()
  })

  it('mostra o estado vazio com ação', async () => {
    mockFetch([{ caminho: '/api/categorias/', corpo: [] }])
    renderComRotas(<CategoriasPage />)
    expect(await screen.findByText('Nenhuma categoria cadastrada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar primeira categoria' })).toBeInTheDocument()
  })

  it('cria uma categoria', async () => {
    const fetchMock = mockFetch([
      { caminho: '/api/categorias/', corpo: [] },
      { metodo: 'POST', caminho: '/api/categorias/', status: 201, corpo: { ...salario, id: 5, nome: 'Bônus' } },
    ])
    renderComRotas(<CategoriasPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Nova categoria' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Nome'), 'Bônus')
    await userEvent.selectOptions(within(dialogo).getByLabelText('Tipo'), 'RECEITA')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    await vi.waitFor(() => expect(chamadas(fetchMock, 'POST', '/api/categorias/')).toHaveLength(1))
    const [[, init]] = chamadas(fetchMock, 'POST', '/api/categorias/')
    expect(JSON.parse(String(init?.body))).toEqual({ nome: 'Bônus', tipo: 'RECEITA', cor: '#64748B' })
  })

  it('exibe o erro de validação no campo', async () => {
    mockFetch([
      { caminho: '/api/categorias/', corpo: [mercado] },
      {
        metodo: 'POST',
        caminho: '/api/categorias/',
        status: 400,
        corpo: { nome: ['Já existe uma categoria com esse nome.'] },
      },
    ])
    renderComRotas(<CategoriasPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Nova categoria' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Nome'), 'mercado')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))
    expect(await within(dialogo).findByText('Já existe uma categoria com esse nome.')).toBeInTheDocument()
    expect(within(dialogo).getByLabelText('Nome')).toHaveAttribute('aria-invalid', 'true')
  })

  it('bloqueia a exclusão com a mensagem do backend quando há transações', async () => {
    mockFetch([
      { caminho: '/api/categorias/', corpo: [mercado] },
      {
        metodo: 'DELETE',
        caminho: '/api/categorias/1/',
        status: 409,
        corpo: { detail: 'Esta categoria tem transações e não pode ser excluída.', transacoes: 3 },
      },
    ])
    renderComRotas(<CategoriasPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Mercado' }))
    const dialogo = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Excluir' }))
    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(
      'Esta categoria tem transações e não pode ser excluída.',
    )
  })

  it('não permite trocar o tipo de categoria com transações', async () => {
    mockFetch([{ caminho: '/api/categorias/', corpo: [mercado] }])
    renderComRotas(<CategoriasPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Editar Mercado' }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByLabelText('Tipo')).toBeDisabled()
  })
})
