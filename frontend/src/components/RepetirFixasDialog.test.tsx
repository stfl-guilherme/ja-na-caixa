import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FixaParaRepetir } from '@/api/types'
import { chamadas, mockFetch, personagensNaTela, renderComRotas } from '@/test/utils'
import { RepetirFixasDialog } from './RepetirFixasDialog'

function fixa(id: number, descricao: string, valor: string, dia: string): FixaParaRepetir {
  return {
    id,
    categoria: 2,
    categoria_nome: 'Moradia',
    categoria_cor: '#2F6FB2',
    tipo: 'DESPESA',
    descricao,
    valor,
    data: `2026-10-${dia}`,
    observacao: '',
    forma_pagamento: 'BOLETO',
    forma_pagamento_rotulo: 'Boleto',
    fixa: true,
    repetida_de: null,
    criado_em: '',
    atualizado_em: '',
    data_sugerida: `2026-11-${dia}`,
  }
}

const FIXAS = [fixa(1, 'Aluguel', '1200.00', '09'), fixa(2, 'Internet', '99.00', '15')]
const semNbsp = (t: string | null) => (t ?? '').replace(/ /g, ' ')

function abrir(fixas: FixaParaRepetir[] = FIXAS) {
  const fetchMock = mockFetch([
    { caminho: '/api/transacoes/fixas-para-repetir/', corpo: fixas },
    { metodo: 'POST', caminho: '/api/transacoes/repetir-fixas/', status: 201, corpo: [] },
  ])
  const onLancadas = vi.fn()
  renderComRotas(<RepetirFixasDialog aberto mes="2026-11" onFechar={vi.fn()} onLancadas={onLancadas} />)
  return { fetchMock, onLancadas }
}

describe('RepetirFixasDialog', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('lista as fixas do mês anterior, todas marcadas, com categoria, valor e data sugerida', async () => {
    abrir()
    const dialogo = await screen.findByRole('dialog', { name: 'Repetir fixas de outubro' })
    const aluguel = await within(dialogo).findByRole('checkbox', { name: /Aluguel/ })
    expect(aluguel).toBeChecked()
    expect(within(dialogo).getByRole('checkbox', { name: /Internet/ })).toBeChecked()
    const item = aluguel.closest('li') as HTMLElement
    expect(semNbsp(item.textContent)).toContain('Moradia')
    expect(semNbsp(item.textContent)).toContain('R$ 1.200,00')
    expect(semNbsp(item.textContent)).toContain('09/11/2026')
    expect(within(dialogo).getByRole('button', { name: 'Lançar 2 transações' })).toBeEnabled()
  })

  it('desmarcar muda o total e envia só as marcadas', async () => {
    const { fetchMock, onLancadas } = abrir()
    const dialogo = await screen.findByRole('dialog')
    await userEvent.click(await within(dialogo).findByRole('checkbox', { name: /Internet/ }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Lançar 1 transação' }))
    await vi.waitFor(() => expect(onLancadas).toHaveBeenCalledWith(0))
    const [[, init]] = chamadas(fetchMock, 'POST', '/api/transacoes/repetir-fixas/')
    expect(JSON.parse(String(init?.body))).toEqual({ mes: '2026-11', ids: [1] })
  })

  it('sem nenhuma marcada, o botão fica desabilitado', async () => {
    abrir()
    const dialogo = await screen.findByRole('dialog')
    await userEvent.click(await within(dialogo).findByRole('checkbox', { name: /Aluguel/ }))
    await userEvent.click(within(dialogo).getByRole('checkbox', { name: /Internet/ }))
    expect(within(dialogo).getByRole('button', { name: 'Lançar 0 transações' })).toBeDisabled()
  })

  it('lista vazia avisa que não há o que repetir', async () => {
    abrir([])
    const dialogo = await screen.findByRole('dialog')
    expect(await within(dialogo).findByText('Nenhuma transação fixa de outubro para repetir.')).toBeInTheDocument()
    expect(within(dialogo).queryByRole('button', { name: /Lançar/ })).not.toBeInTheDocument()
    expect(personagensNaTela().length).toBeLessThanOrEqual(1)
  })
})
