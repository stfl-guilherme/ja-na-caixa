import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Dica } from '@/api/types'
import { chaveDicaAuto } from '@/lib/dicasAuto'
import { personagensNaTela } from '@/test/utils'
import { DicasFlutuantes } from './DicasFlutuantes'

const ALERTA: Dica = { id: 'orcamento_estourado', tipo: 'alerta', texto: 'Lazer passou do limite em R$ 82,50.', link: '/transacoes?categoria=5&mes=2026-11' }
const INFO: Dica = { id: 'orcamento_perto', tipo: 'info', texto: 'Mercado já usou 85% do limite de novembro.', link: '/transacoes?categoria=3&mes=2026-11' }
const PARABENS: Dica = { id: 'despesas_cairam', tipo: 'parabens', texto: 'Suas despesas caíram R$ 250,00 em relação a outubro. Boa!', link: null }

function Controlado({ dicas, mes = '2026-11', usuario = 'demo' }: { dicas: Dica[]; mes?: string; usuario?: string }) {
  const [indice, setIndice] = useState(0)
  return (
    <MemoryRouter>
      <p>Fora do balão</p>
      <DicasFlutuantes dicas={dicas} indice={indice} onProxima={() => setIndice((i) => (i + 1) % dicas.length)} usuario={usuario} mes={mes} />
    </MemoryRouter>
  )
}

const botao = () => screen.getByRole('button', { name: /^Dicas do Papo,/ })
const balao = () => screen.queryByRole('region', { name: 'Dicas do Papo' })

describe('DicasFlutuantes', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('selo com "?" e a quantidade só no rótulo; fechado por padrão sem alerta', () => {
    render(<Controlado dicas={[INFO, PARABENS]} />)
    expect(botao()).toHaveAccessibleName('Dicas do Papo, 2 dicas')
    expect(botao()).toHaveTextContent(/^\?$/)
    expect(botao()).toHaveAttribute('aria-expanded', 'false')
    expect(balao()).not.toBeInTheDocument()
  })

  it('abre por clique com o mesmo conteúdo e o foco vai para o balão; o botão fechar devolve o foco', async () => {
    localStorage.setItem(chaveDicaAuto('demo', '2026-11'), '1') // já abriu sozinho neste mês
    render(<Controlado dicas={[INFO, PARABENS, ALERTA]} />)
    await userEvent.click(botao())
    expect(botao()).toHaveAttribute('aria-expanded', 'true')
    expect(balao()).toHaveTextContent('Mercado já usou 85%')
    expect(screen.getByRole('link', { name: 'Ver transações' })).toBeInTheDocument()
    expect(screen.getByTestId('balao-dicas')).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Próxima dica (1/3)' }))
    expect(balao()).toHaveTextContent('Suas despesas caíram')
    await userEvent.click(screen.getByRole('button', { name: 'Fechar dicas' }))
    expect(balao()).not.toBeInTheDocument()
    expect(botao()).toHaveFocus()
  })

  it('Esc fecha e devolve o foco ao botão', async () => {
    render(<Controlado dicas={[INFO]} />)
    await userEvent.click(botao())
    expect(balao()).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(balao()).not.toBeInTheDocument()
    expect(botao()).toHaveFocus()
  })

  it('clique fora fecha; clique no botão alterna', async () => {
    render(<Controlado dicas={[INFO]} />)
    await userEvent.click(botao())
    await userEvent.click(screen.getByText('Fora do balão'))
    expect(balao()).not.toBeInTheDocument()
    await userEvent.click(botao())
    expect(balao()).toBeInTheDocument()
    await userEvent.click(botao())
    expect(balao()).not.toBeInTheDocument()
  })

  it('abre sozinho com alerta, sem roubar o foco, e anuncia o texto', () => {
    render(<Controlado dicas={[ALERTA, INFO]} />)
    expect(balao()).toHaveTextContent('Lazer passou do limite')
    expect(document.body).toHaveFocus()
    const anuncio = screen.getByTestId('anuncio-dica')
    expect(anuncio).toHaveAttribute('aria-live', 'polite')
    expect(anuncio).toHaveTextContent('Lazer passou do limite em R$ 82,50.')
  })

  it('abre sozinho só uma vez por usuário e por mês', () => {
    const { unmount } = render(<Controlado dicas={[ALERTA]} />)
    expect(balao()).toBeInTheDocument()
    unmount()
    const segunda = render(<Controlado dicas={[ALERTA]} />)
    expect(balao()).not.toBeInTheDocument()
    segunda.unmount()
    const outroMes = render(<Controlado dicas={[ALERTA]} mes="2026-10" />)
    expect(balao()).toBeInTheDocument()
    outroMes.unmount()
    render(<Controlado dicas={[ALERTA]} usuario="outra" />)
    expect(balao()).toBeInTheDocument()
    expect(localStorage.getItem(chaveDicaAuto('demo', '2026-11'))).toBe('1')
  })

  it('sem alerta não abre sozinho', () => {
    render(<Controlado dicas={[INFO, PARABENS]} />)
    expect(balao()).not.toBeInTheDocument()
  })

  it('se o localStorage falhar, não abre sozinho', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    render(<Controlado dicas={[ALERTA]} />)
    expect(balao()).not.toBeInTheDocument()
    expect(botao()).toBeInTheDocument()
  })

  it('a pose do botão troca com o tipo da dica exibida', async () => {
    localStorage.setItem(chaveDicaAuto('demo', '2026-11'), '1')
    render(<Controlado dicas={[ALERTA, PARABENS, INFO]} />)
    expect(personagensNaTela(botao())).toEqual(['papo-preocupado'])
    await userEvent.click(botao())
    await userEvent.click(screen.getByRole('button', { name: 'Próxima dica (1/3)' }))
    expect(personagensNaTela(botao())).toEqual(['papo-joinha'])
    await userEvent.click(screen.getByRole('button', { name: 'Próxima dica (2/3)' }))
    expect(personagensNaTela(botao())).toEqual(['papo-espiando'])
    await userEvent.click(screen.getByRole('button', { name: 'Próxima dica (3/3)' }))
    expect(personagensNaTela(botao())).toEqual(['papo-preocupado'])
  })

  it('pose inicial do botão pela primeira dica', () => {
    const casos: [Dica[], string][] = [
      [[ALERTA], 'papo-preocupado'],
      [[PARABENS, ALERTA], 'papo-joinha'],
      [[INFO], 'papo-espiando'],
    ]
    for (const [dicas, pose] of casos) {
      localStorage.setItem(chaveDicaAuto('demo', '2026-11'), '1')
      const { unmount } = render(<Controlado dicas={dicas} />)
      expect(personagensNaTela(botao())).toEqual([pose])
      unmount()
    }
  })

  it('sem dicas, nada renderiza', () => {
    const { container } = render(<Controlado dicas={[]} />)
    expect(screen.queryByRole('button', { name: /^Dicas do Papo,/ })).not.toBeInTheDocument()
    expect(personagensNaTela(container)).toEqual([])
  })

  it('uma dica: rótulo no singular', () => {
    render(<Controlado dicas={[INFO]} />)
    expect(botao()).toHaveAccessibleName('Dicas do Papo, 1 dica')
  })
})
