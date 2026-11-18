import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MetricCard } from './MetricCard'

const semNbsp = (texto: string | null) => (texto ?? '').replace(/ /g, ' ')

function renderCard(props: Partial<Parameters<typeof MetricCard>[0]> = {}) {
  return render(
    <MemoryRouter>
      <MetricCard metrica="despesa" valor="3711.81" anterior="4105.60" mes="2026-11" mesAnterior="2026-10" animar={false} {...props} />
    </MemoryRouter>,
  )
}

function comparacao() {
  return screen.getByTestId('comparacao')
}

describe('MetricCard', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('Despesas: queda é verde e diz "gastou menos"', () => {
    renderCard({ valor: '3711.81', anterior: '4105.60' })
    expect(comparacao()).toHaveTextContent('9,6% vs outubro · gastou menos')
    expect(comparacao().className).toContain('text-receita')
    expect(comparacao().querySelector('[data-seta="desceu"]')).not.toBeNull()
  })

  it('Despesas: aumento é vermelho e diz "gastou mais"', () => {
    renderCard({ valor: '4500.00', anterior: '4000.00' })
    expect(comparacao()).toHaveTextContent('12,5% vs outubro · gastou mais')
    expect(comparacao().className).toContain('text-despesa')
    expect(comparacao().querySelector('[data-seta="subiu"]')).not.toBeNull()
  })

  it('Receitas: aumento é verde', () => {
    renderCard({ metrica: 'receita', valor: '6686.42', anterior: '6420.00' })
    expect(comparacao()).toHaveTextContent('ganhou mais')
    expect(comparacao().className).toContain('text-receita')
  })

  it('mostra o valor com sinal e cor de cada métrica', () => {
    renderCard({ metrica: 'receita', valor: '6686.42' })
    expect(semNbsp(screen.getByTestId('valor').textContent)).toBe('+ R$ 6.686,42')
    expect(screen.getByTestId('valor').className).toContain('text-receita')
  })

  it('saldo negativo fica coral e com sinal de menos', () => {
    renderCard({ metrica: 'saldo', valor: '-625.39', anterior: '2314.40' })
    expect(semNbsp(screen.getByTestId('valor').textContent)).toBe('− R$ 625,39')
    expect(screen.getByTestId('valor').className).toContain('text-despesa')
  })

  it('é um link para Transações já filtrada, com descrição completa', () => {
    renderCard({ metrica: 'despesa', valor: '3711.81', anterior: '4105.60' })
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/transacoes?mes=2026-11&tipo=DESPESA')
    expect(semNbsp(link.getAttribute('aria-label'))).toBe(
      'Despesas de novembro: − R$ 3.711,81. 9,6% vs outubro · gastou menos. Abrir transações filtradas.',
    )
  })

  it('sem movimento no mês anterior não mostra percentual', () => {
    renderCard({ anterior: '0.00' })
    expect(comparacao()).toHaveTextContent('Sem movimento em outubro para comparar')
  })

  it('a contagem animada termina exatamente no valor da API', () => {
    let quadro: FrameRequestCallback = () => {}
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      quadro = cb
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})
    vi.spyOn(performance, 'now').mockReturnValue(0)
    renderCard({ metrica: 'receita', valor: '6686.42', animar: true })
    expect(semNbsp(screen.getByTestId('valor').textContent)).toBe('+ R$ 0,00')
    act(() => quadro(450))
    expect(semNbsp(screen.getByTestId('valor').textContent)).not.toBe('+ R$ 6.686,42')
    act(() => quadro(900))
    expect(semNbsp(screen.getByTestId('valor').textContent)).toBe('+ R$ 6.686,42')
  })

  it('não anima com prefers-reduced-motion', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} }))
    renderCard({ metrica: 'receita', valor: '6686.42', animar: true })
    expect(semNbsp(screen.getByTestId('valor').textContent)).toBe('+ R$ 6.686,42')
  })
})
