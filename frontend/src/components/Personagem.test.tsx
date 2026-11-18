import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { personagensNaTela } from '@/test/utils'
import { Espiando, Personagem } from './Personagem'

describe('Personagem', () => {
  it('renderiza o PNG da pose como decoração', () => {
    const { container } = render(<Personagem pose="papo-joinha" altura={40} />)
    const img = container.querySelector('img')!
    expect(img).toHaveAttribute('alt', '')
    expect(img).toHaveAttribute('aria-hidden', 'true')
    expect(img.getAttribute('src')).toContain('papo-joinha')
    expect(img).toHaveAttribute('data-personagem', 'papo-joinha')
    expect(img.style.height).toBe('40px')
  })

  it('fica fora da árvore de acessibilidade', () => {
    render(<Personagem pose="caranguejo" altura={84} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('variante espiando fica atrás do cartão, com no máximo 72px acima da borda', () => {
    const { container } = render(
      <Espiando pose="papo-espiando" altura={80}>
        <div>Cartão</div>
      </Espiando>,
    )
    const img = container.querySelector('img')!
    expect(img.style.top).toBe('-72px')
    expect(img.className).toContain('z-0')
    expect(screen.getByText('Cartão').parentElement!.className).toContain('z-10')
  })

  it('variante espiando sem personagem só renderiza o cartão', () => {
    const { container } = render(
      <Espiando pose={null} altura={80}>
        <div>Cartão</div>
      </Espiando>,
    )
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('Cartão')).toBeInTheDocument()
  })

  it('conta os personagens visíveis em um trecho da tela', () => {
    const { container } = render(
      <div>
        <Personagem pose="papo-espiando-lado" altura={240} />
        <Personagem pose="gaivota" altura={150} />
      </div>,
    )
    expect(personagensNaTela(container)).toEqual(['papo-espiando-lado', 'gaivota'])
  })
})
