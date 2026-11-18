import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import type { Categoria, Transacao } from '@/api/types'
import { MENSAGENS } from '@/lib/mensagens'
import { FormularioTransacao } from './TransacaoModal'

const categorias: Categoria[] = [
  { id: 1, nome: 'Mercado', tipo: 'DESPESA', cor: '#B5541A', transacoes: 0, criado_em: '' },
  { id: 2, nome: 'Salário', tipo: 'RECEITA', cor: '#2F7D35', transacoes: 0, criado_em: '' },
]

function renderForm(props: Partial<Parameters<typeof FormularioTransacao>[0]> = {}) {
  const onSalvar = vi.fn()
  render(
    <FormularioTransacao categorias={categorias} onSalvar={onSalvar} onCancelar={vi.fn()} salvando={false} erroApi={null} {...props} />,
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
    })
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
    expect(campo(/^Categoria/)).toHaveAccessibleDescription(`Tipo vem da categoria ${MENSAGENS.categoria}`)
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

  it('o tipo vem da categoria escolhida', async () => {
    renderForm()
    expect(screen.getByText('Tipo vem da categoria')).toBeInTheDocument()
    await userEvent.selectOptions(campo(/^Categoria/), '2')
    expect(screen.getByText('Receita: entra no saldo')).toBeInTheDocument()
    await userEvent.selectOptions(campo(/^Categoria/), '1')
    expect(screen.getByText('Despesa: sai do saldo')).toBeInTheDocument()
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
