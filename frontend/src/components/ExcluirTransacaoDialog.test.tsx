import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Transacao } from '@/api/types'
import { chamadas, mockFetch, renderComRotas } from '@/test/utils'
import { ExcluirTransacaoDialog } from './ExcluirTransacaoDialog'

const transacao: Transacao = {
  id: 10,
  categoria: 1,
  categoria_nome: 'Mercado',
  categoria_cor: '#B5541A',
  tipo: 'DESPESA',
  descricao: 'Supermercado',
  valor: '123.45',
  data: '2026-11-10',
  observacao: '',
  forma_pagamento: 'NAO_INFORMADO',
  forma_pagamento_rotulo: 'Não informado',
  fixa: false,
  repetida_de: null,
  criado_em: '',
  atualizado_em: '',
}

describe('ExcluirTransacaoDialog', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('mostra a transação e exclui após confirmação', async () => {
    const fetchMock = mockFetch([{ metodo: 'DELETE', caminho: '/api/transacoes/10/', status: 204 }])
    const onExcluida = vi.fn()
    renderComRotas(<ExcluirTransacaoDialog transacao={transacao} onFechar={vi.fn()} onExcluida={onExcluida} />)
    const dialogo = await screen.findByRole('alertdialog', { name: 'Excluir transação?' })
    expect(within(dialogo).getByText(/sai do saldo e dos gráficos de novembro/)).toBeInTheDocument()
    expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Excluir transação' }))
    await vi.waitFor(() => expect(chamadas(fetchMock, 'DELETE', '/api/transacoes/10/')).toHaveLength(1))
    await vi.waitFor(() => expect(onExcluida).toHaveBeenCalled())
  })
})
