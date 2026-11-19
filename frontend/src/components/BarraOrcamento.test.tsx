import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Orcamento } from '@/api/types'
import { BarraOrcamento } from './BarraOrcamento'

const semNbsp = (texto: string | null) => (texto ?? '').replace(/ /g, ' ')

const base: Orcamento = {
  categoria_id: 4,
  nome: 'Mercado',
  cor: '#B5541A',
  limite: '500.00',
  gasto: '340.00',
  percentual: '68.00',
  excesso: '0.00',
  situacao: 'ok',
}

function textoDa(barra: HTMLElement) {
  return semNbsp(barra.textContent)
}

describe('BarraOrcamento', () => {
  it('mostra gasto, limite e percentual', () => {
    render(<BarraOrcamento orcamento={base} />)
    expect(textoDa(screen.getByTestId('barra-orcamento'))).toContain('R$ 340,00 de R$ 500,00 (68%)')
  })

  it('dentro do limite: estado em texto', () => {
    render(<BarraOrcamento orcamento={base} />)
    expect(screen.getByText('Dentro do limite')).toBeInTheDocument()
  })

  it('atenção: estado em texto', () => {
    render(<BarraOrcamento orcamento={{ ...base, gasto: '400.00', percentual: '80.00', situacao: 'atencao' }} />)
    expect(screen.getByText('Atenção')).toBeInTheDocument()
  })

  it('estourado: diz quanto passou, com o valor do backend', () => {
    render(
      <BarraOrcamento orcamento={{ ...base, gasto: '582.50', percentual: '116.50', excesso: '82.50', situacao: 'estourado' }} />,
    )
    expect(textoDa(screen.getByTestId('barra-orcamento'))).toContain('Limite ultrapassado em R$ 82,50')
  })

  it('percentual truncado: 79,99% aparece como 79%', () => {
    render(<BarraOrcamento orcamento={{ ...base, gasto: '399.95', percentual: '79.99' }} />)
    expect(textoDa(screen.getByTestId('barra-orcamento'))).toContain('(79%)')
  })

  it('barra acessível com valor limitado a 100', () => {
    render(
      <BarraOrcamento orcamento={{ ...base, gasto: '582.50', percentual: '116.50', excesso: '82.50', situacao: 'estourado' }} />,
    )
    const barra = screen.getByRole('progressbar', { name: 'Orçamento de Mercado' })
    expect(barra).toHaveAttribute('aria-valuenow', '100')
    expect(semNbsp(barra.getAttribute('aria-valuetext'))).toContain('Limite ultrapassado em R$ 82,50')
  })

  it('com nome, mostra a categoria', () => {
    render(<BarraOrcamento orcamento={base} comNome />)
    expect(screen.getByText('Mercado')).toBeInTheDocument()
  })

  it('a cor da barra depende do estado, não da categoria; a categoria fica só no marcador', () => {
    const casos = [
      { situacao: 'ok', percentual: '68.00', classe: 'bg-estado-sucesso' },
      { situacao: 'atencao', percentual: '85.00', classe: 'bg-estado-atencao' },
      { situacao: 'estourado', percentual: '116.50', classe: 'bg-estado-erro' },
    ] as const
    for (const cor of ['#B5541A', '#2F7D35', '#C2416A']) {
      for (const { situacao, percentual, classe } of casos) {
        const { unmount } = render(<BarraOrcamento orcamento={{ ...base, cor, situacao, percentual }} comNome />)
        const preenchimento = screen.getByTestId('preenchimento')
        expect(preenchimento).toHaveClass(classe)
        expect(preenchimento.style.background).toBe('')
        expect(preenchimento.style.backgroundColor).toBe('')
        const marcador = screen.getByTestId('barra-orcamento').querySelector('[aria-hidden="true"].rounded-full') as HTMLElement
        expect(marcador.style.background).not.toBe('')
        unmount()
      }
    }
  })
})
