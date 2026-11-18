import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import type { Categoria, Transacao } from '@/api/types'
import { TransacaoForm } from './TransacaoForm'

const categorias: Categoria[] = [
  { id: 1, nome: 'Mercado', tipo: 'DESPESA', cor: '#22C55E', transacoes: 0, criado_em: '' },
  { id: 2, nome: 'Salário', tipo: 'RECEITA', cor: '#16A34A', transacoes: 0, criado_em: '' },
]

function renderForm(props: Partial<Parameters<typeof TransacaoForm>[0]> = {}) {
  const onSalvar = vi.fn()
  render(
    <TransacaoForm
      categorias={categorias}
      onSalvar={onSalvar}
      onCancelar={vi.fn()}
      salvando={false}
      erro={null}
      {...props}
    />,
  )
  return { onSalvar }
}

async function preencher({ valor = '1.234,56' } = {}) {
  await userEvent.type(screen.getByLabelText('Descrição'), 'Supermercado')
  await userEvent.type(screen.getByLabelText('Valor (R$)'), valor)
  await userEvent.clear(screen.getByLabelText('Data'))
  await userEvent.type(screen.getByLabelText('Data'), '2026-11-10')
  await userEvent.selectOptions(screen.getByLabelText('Categoria'), '1')
}

describe('TransacaoForm', () => {
  it('envia o valor em formato brasileiro convertido para a API', async () => {
    const { onSalvar } = renderForm()
    await preencher()
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onSalvar).toHaveBeenCalledWith({
      descricao: 'Supermercado',
      valor: '1234.56',
      data: '2026-11-10',
      categoria: 1,
      observacao: '',
    })
  })

  it('bloqueia o envio com valor inválido', async () => {
    const { onSalvar } = renderForm()
    await preencher({ valor: '12,345' })
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onSalvar).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Valor (R$)')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(/valor maior que zero/i)).toBeInTheDocument()
  })

  it('bloqueia o envio sem categoria', async () => {
    const { onSalvar } = renderForm()
    await userEvent.type(screen.getByLabelText('Descrição'), 'X')
    await userEvent.type(screen.getByLabelText('Valor (R$)'), '10')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onSalvar).not.toHaveBeenCalled()
    expect(screen.getByText('Escolha uma categoria.')).toBeInTheDocument()
  })

  it('exibe os erros retornados pela API em cada campo', () => {
    const erro = new ApiError(400, 'Verifique os campos destacados.', null, {
      valor: ['O valor deve ser maior que zero.'],
      categoria: ['Pk inválido "9" - objeto não existe.'],
      descricao: ['Este campo não pode ser em branco.'],
    })
    renderForm({ erro })
    expect(screen.getByText('O valor deve ser maior que zero.')).toBeInTheDocument()
    expect(screen.getByText('Pk inválido "9" - objeto não existe.')).toBeInTheDocument()
    expect(screen.getByText('Este campo não pode ser em branco.')).toBeInTheDocument()
    expect(screen.getByLabelText('Valor (R$)')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Categoria')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Descrição')).toHaveAttribute('aria-invalid', 'true')
  })

  it('preenche os campos ao editar', () => {
    const transacao: Transacao = {
      id: 7,
      categoria: 2,
      categoria_nome: 'Salário',
      categoria_cor: '#16A34A',
      tipo: 'RECEITA',
      descricao: 'Pagamento',
      valor: '4500.00',
      data: '2026-11-05',
      observacao: 'Novembro',
      criado_em: '',
      atualizado_em: '',
    }
    renderForm({ transacao })
    expect(screen.getByLabelText('Descrição')).toHaveValue('Pagamento')
    expect(screen.getByLabelText('Valor (R$)')).toHaveValue('4.500,00')
    expect(screen.getByLabelText('Data')).toHaveValue('2026-11-05')
    expect(screen.getByLabelText('Categoria')).toHaveValue('2')
    expect(screen.getByLabelText('Observação')).toHaveValue('Novembro')
  })
})
