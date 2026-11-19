import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Dica } from '@/api/types'
import { personagensNaTela } from '@/test/utils'
import { DicasDoPapo } from './DicasDoPapo'

const DICAS: Dica[] = [
  { id: 'orcamento_estourado', tipo: 'alerta', texto: 'Lazer passou do limite em R$ 82,50.', link: '/transacoes?categoria=5&mes=2026-11' },
  { id: 'orcamento_perto', tipo: 'info', texto: 'Mercado já usou 85% do limite de novembro.', link: '/transacoes?categoria=3&mes=2026-11' },
  { id: 'despesas_cairam', tipo: 'parabens', texto: 'Suas despesas caíram R$ 250,00 em relação a outubro. Boa!', link: null },
]

function Controlado({ dicas, variante = 'cartao' }: { dicas: Dica[]; variante?: 'cartao' | 'vazio' | 'flutuante' }) {
  const [indice, setIndice] = useState(0)
  return (
    <MemoryRouter>
      <DicasDoPapo dicas={dicas} indice={indice} onProxima={() => setIndice((i) => (i + 1) % dicas.length)} variante={variante} />
    </MemoryRouter>
  )
}

describe('DicasDoPapo', () => {
  it('mostra uma dica por vez numa região rotulada', () => {
    render(<Controlado dicas={DICAS} />)
    const regiao = screen.getByRole('region', { name: 'Dicas do Papo' })
    expect(regiao).toHaveTextContent('Lazer passou do limite em R$ 82,50.')
    expect(regiao).not.toHaveTextContent('Mercado já usou')
    expect(regiao).toHaveTextContent('Alerta')
  })

  it('"Próxima dica" avança e volta para a primeira depois da última', async () => {
    render(<Controlado dicas={DICAS} />)
    const regiao = screen.getByRole('region', { name: 'Dicas do Papo' })
    await userEvent.click(screen.getByRole('button', { name: 'Próxima dica (1/3)' }))
    expect(regiao).toHaveTextContent('Mercado já usou 85% do limite de novembro.')
    await userEvent.click(screen.getByRole('button', { name: 'Próxima dica (2/3)' }))
    expect(regiao).toHaveTextContent('Suas despesas caíram')
    await userEvent.click(screen.getByRole('button', { name: 'Próxima dica (3/3)' }))
    expect(regiao).toHaveTextContent('Lazer passou do limite')
  })

  it('pose do Papo pelo tipo da dica, com a imagem decorativa', async () => {
    render(<Controlado dicas={DICAS} />)
    expect(personagensNaTela()).toEqual(['papo-preocupado'])
    const imagem = document.querySelector('img[data-personagem]')
    expect(imagem).toHaveAttribute('alt', '')
    expect(imagem).toHaveAttribute('aria-hidden', 'true')
    await userEvent.click(screen.getByRole('button', { name: /Próxima dica/ }))
    expect(personagensNaTela()).toEqual(['papo-espiando'])
    await userEvent.click(screen.getByRole('button', { name: /Próxima dica/ }))
    expect(personagensNaTela()).toEqual(['papo-joinha'])
  })

  it('"Ver transações" leva ao link da dica; sem link, não aparece', async () => {
    render(<Controlado dicas={DICAS} />)
    expect(screen.getByRole('link', { name: 'Ver transações' })).toHaveAttribute('href', '/transacoes?categoria=5&mes=2026-11')
    await userEvent.click(screen.getByRole('button', { name: /Próxima dica/ }))
    await userEvent.click(screen.getByRole('button', { name: /Próxima dica/ }))
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('link para categorias diz "Ver categorias"; uma dica só não tem "Próxima"', () => {
    render(
      <Controlado
        dicas={[{ id: 'primeira_categoria', tipo: 'primeiros_passos', texto: 'Crie sua primeira categoria para começar.', link: '/categorias' }]}
      />,
    )
    expect(screen.getByRole('link', { name: 'Ver categorias' })).toHaveAttribute('href', '/categorias')
    expect(screen.queryByRole('button', { name: /Próxima dica/ })).not.toBeInTheDocument()
  })

  it('balão flutuante e do estado vazio não trazem imagem própria', () => {
    const { unmount } = render(<Controlado dicas={DICAS} variante="flutuante" />)
    expect(personagensNaTela()).toEqual([])
    unmount()
    render(<Controlado dicas={DICAS} variante="vazio" />)
    expect(personagensNaTela()).toEqual([])
  })

  it('sem dicas, nada aparece', () => {
    render(<Controlado dicas={[]} />)
    expect(screen.queryByRole('region', { name: 'Dicas do Papo' })).not.toBeInTheDocument()
  })
})
