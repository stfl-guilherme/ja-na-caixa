import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import type { Categoria, Transacao } from '@/api/types'
import { MENSAGENS } from '@/lib/mensagens'
import { QueryClientProvider } from '@tanstack/react-query'
import { chamadas, criarQueryClient, mockFetch } from '@/test/utils'
import { FormularioTransacao } from './TransacaoModal'

const categorias: Categoria[] = [
  { id: 1, nome: 'Mercado', tipo: 'DESPESA', cor: '#B5541A', limite_mensal: null, transacoes: 0, criado_em: '' },
  { id: 2, nome: 'Salário', tipo: 'RECEITA', cor: '#2F7D35', limite_mensal: null, transacoes: 0, criado_em: '' },
]

function renderForm(props: Partial<Parameters<typeof FormularioTransacao>[0]> = {}) {
  const onSalvar = vi.fn()
  render(
    <QueryClientProvider client={criarQueryClient()}>
      <FormularioTransacao categorias={categorias} onSalvar={onSalvar} onCancelar={vi.fn()} salvando={false} erroApi={null} {...props} />
    </QueryClientProvider>,
  )
  return { onSalvar }
}

const campo = (rotulo: RegExp) => screen.getByLabelText(rotulo)

async function preencher({ valor = '123456', data = '10112026' } = {}) {
  await userEvent.type(campo(/^Descrição/), 'Supermercado')
  await userEvent.clear(campo(/^Valor/))
  await userEvent.type(campo(/^Valor/), valor)
  await userEvent.clear(campo(/^Data/))
  await userEvent.type(campo(/^Data/), data)
  await userEvent.selectOptions(campo(/^Categoria/), '1')
}

describe('FormularioTransacao', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 17))
  })
  afterEach(() => vi.useRealTimers())

  it('monta o valor pelos centavos e envia no formato da API', async () => {
    const { onSalvar } = renderForm()
    await preencher()
    expect(campo(/^Valor/)).toHaveValue('1.234,56')
    expect(campo(/^Data/)).toHaveValue('10/11/2026')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onSalvar).toHaveBeenCalledWith({
      descricao: 'Supermercado',
      valor: '1234.56',
      data: '2026-11-10',
      categoria: 1,
      observacao: '',
      forma_pagamento: 'NAO_INFORMADO',
    })
  })

  it('envia a forma de pagamento escolhida; em receita, o rótulo vira "Forma de recebimento"', async () => {
    const { onSalvar } = renderForm()
    await preencher()
    expect(campo(/^Forma de pagamento/)).toHaveValue('NAO_INFORMADO')
    await userEvent.selectOptions(campo(/^Forma de pagamento/), 'PIX')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onSalvar).toHaveBeenCalledWith(expect.objectContaining({ forma_pagamento: 'PIX' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Receita' }))
    expect(campo(/^Forma de recebimento/)).toHaveValue('PIX')
    expect(screen.queryByLabelText(/^Forma de pagamento/)).not.toBeInTheDocument()
  })

  it('começa com a data de hoje', () => {
    renderForm()
    expect(campo(/^Data/)).toHaveValue('17/11/2026')
  })

  it('mostra as mensagens exatas do design e liga cada erro ao campo', async () => {
    const { onSalvar } = renderForm()
    await userEvent.clear(campo(/^Data/))
    await userEvent.type(campo(/^Data/), '31042026')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onSalvar).not.toHaveBeenCalled()
    expect(campo(/^Descrição/)).toHaveAccessibleDescription(MENSAGENS.descricao)
    expect(campo(/^Valor/)).toHaveAccessibleDescription(MENSAGENS.valor)
    expect(campo(/^Data/)).toHaveAccessibleDescription(MENSAGENS.data)
    expect(campo(/^Categoria/)).toHaveAccessibleDescription(`Despesa: sai do saldo ${MENSAGENS.categoria}`)
    for (const rotulo of [/^Descrição/, /^Valor/, /^Data/, /^Categoria/]) {
      expect(campo(rotulo)).toHaveAttribute('aria-invalid', 'true')
    }
    expect(MENSAGENS).toEqual({
      descricao: 'Escreva uma descrição, ex.: Mercado do mês.',
      valor: 'Informe um valor maior que R$ 0,00.',
      data: 'Use o formato dd/mm/aaaa, ex.: 17/11/2026.',
      categoria: 'Escolha uma categoria.',
    })
  })

  it('o tipo escolhido filtra as categorias', async () => {
    renderForm()
    expect(screen.getByRole('radio', { name: 'Despesa' })).toBeChecked()
    expect(screen.getByText('Despesa: sai do saldo')).toBeInTheDocument()
    expect(within(campo(/^Categoria/)).queryByRole('option', { name: 'Salário' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Receita' }))
    expect(screen.getByText('Receita: entra no saldo')).toBeInTheDocument()
    expect(within(campo(/^Categoria/)).getByRole('option', { name: 'Salário' })).toBeInTheDocument()
    expect(within(campo(/^Categoria/)).queryByRole('option', { name: 'Mercado' })).not.toBeInTheDocument()
  })

  it('sem categoria do tipo, oferece criar uma e volta com ela selecionada', async () => {
    const fetchMock = mockFetch([
      {
        metodo: 'POST',
        caminho: '/api/categorias/',
        status: 201,
        corpo: { id: 7, nome: 'Freelance', tipo: 'RECEITA', cor: '#2F6FB2', limite_mensal: null, transacoes: 0, criado_em: '' },
      },
    ])
    const { onSalvar } = renderForm({ categorias: [categorias[0]] })
    await userEvent.click(screen.getByRole('radio', { name: 'Receita' }))
    expect(screen.queryByLabelText(/^Categoria/)).not.toBeInTheDocument()
    expect(screen.getByText('Você ainda não tem categorias de receita')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Criar categoria' }))

    const dialogo = await screen.findByRole('dialog', { name: 'Nova categoria' })
    expect(within(dialogo).getByRole('radio', { name: /Receita/ })).toBeChecked()
    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), 'Freelance')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    await vi.waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nova categoria' })).not.toBeInTheDocument())
    expect(JSON.parse(String(chamadas(fetchMock, 'POST', '/api/categorias/')[0][1]?.body))).toMatchObject({ nome: 'Freelance', tipo: 'RECEITA' })
    expect(campo(/^Categoria/)).toHaveValue('7')
    await userEvent.type(campo(/^Descrição/), 'Site')
    await userEvent.type(campo(/^Valor/), '50000')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onSalvar).toHaveBeenCalledWith(expect.objectContaining({ categoria: 7, valor: '500.00' }))
    vi.unstubAllGlobals()
  })

  it('exibe os erros retornados pela API em cada campo', () => {
    const erroApi = new ApiError(400, 'Verifique os campos destacados.', null, {
      valor: ['O valor deve ser maior que zero.'],
      categoria: ['Pk inválido "9" - objeto não existe.'],
      descricao: ['Este campo não pode ser em branco.'],
    })
    renderForm({ erroApi })
    expect(campo(/^Valor/)).toHaveAccessibleDescription('O valor deve ser maior que zero.')
    expect(campo(/^Descrição/)).toHaveAccessibleDescription('Este campo não pode ser em branco.')
    expect(screen.getByText('Pk inválido "9" - objeto não existe.')).toBeInTheDocument()
    expect(campo(/^Categoria/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('preenche os campos ao editar e oferece excluir', async () => {
    const transacao: Transacao = {
      id: 7,
      categoria: 2,
      categoria_nome: 'Salário',
      categoria_cor: '#2F7D35',
      tipo: 'RECEITA',
      descricao: 'Pagamento',
      valor: '4500.00',
      data: '2026-11-05',
      observacao: 'Novembro',
      forma_pagamento: 'NAO_INFORMADO',
      forma_pagamento_rotulo: 'Não informado',
      criado_em: '',
      atualizado_em: '',
    }
    const onExcluir = vi.fn()
    renderForm({ transacao, onExcluir })
    expect(campo(/^Descrição/)).toHaveValue('Pagamento')
    expect(campo(/^Valor/)).toHaveValue('4.500,00')
    expect(campo(/^Data/)).toHaveValue('05/11/2026')
    expect(campo(/^Categoria/)).toHaveValue('2')
    expect(campo(/^Observação/)).toHaveValue('Novembro')
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(onExcluir).toHaveBeenCalled()
  })
})
