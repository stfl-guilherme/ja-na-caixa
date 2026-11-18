import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { resumoAnual2026, resumoNovembro } from '@/test/fixtures'
import { AnoBarChart } from './AnoBarChart'
import { CategoriasTreemap } from './CategoriasTreemap'
import { FluxoEspelhadoChart } from './FluxoEspelhadoChart'
import { SaldoLineChart } from './SaldoLineChart'

const semNbsp = (t: string | null) => (t ?? '').replace(/ /g, ' ')

describe('SaldoLineChart', () => {
  const renderGrafico = () =>
    render(<SaldoLineChart serie={resumoNovembro.serie_diaria} ultimoDia={17} mes="2026-11" progresso={1} compacto={false} />)

  it('resume o gráfico no aria-label', () => {
    renderGrafico()
    expect(semNbsp(screen.getByRole('img').getAttribute('aria-label'))).toBe(
      'Gráfico de linha do saldo acumulado em novembro: começa em + R$ 3.750,00 no dia 1 e chega a + R$ 2.974,61 no dia 17. Use as setas para ver cada dia.',
    )
  })

  it('tem tabela equivalente só até o dia desenhado', () => {
    renderGrafico()
    const tabela = screen.getByRole('table', { name: 'Saldo acumulado por dia em novembro' })
    expect(within(tabela).getAllByRole('row')).toHaveLength(18)
  })

  it('mostra o dia no tooltip e anda com as setas do teclado', () => {
    renderGrafico()
    const area = screen.getByRole('img')
    fireEvent.focus(area)
    expect(semNbsp(screen.getByRole('status').textContent)).toBe('17/11/2026+ R$ 2.974,61')
    fireEvent.keyDown(area, { key: 'ArrowLeft' })
    expect(screen.getByRole('status')).toHaveTextContent('16/11/2026')
    for (let i = 0; i < 20; i++) fireEvent.keyDown(area, { key: 'ArrowLeft' })
    expect(screen.getByRole('status')).toHaveTextContent('01/11/2026')
    fireEvent.blur(area)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('FluxoEspelhadoChart', () => {
  it('tem aria-label e tabela com os dias que tiveram movimento', () => {
    render(<FluxoEspelhadoChart serie={resumoNovembro.serie_diaria} mes="2026-11" progresso={1} compacto={false} />)
    expect(semNbsp(screen.getByRole('img').getAttribute('aria-label'))).toContain('Maior receita em um dia: R$ 5.200,00')
    const tabela = screen.getByRole('table', { name: 'Receitas e despesas por dia em novembro' })
    expect(within(tabela).getAllByRole('row')).toHaveLength(4)
  })
})

describe('AnoBarChart', () => {
  it('marca meses futuros como sem dados', () => {
    render(<AnoBarChart anual={resumoAnual2026} mes="2026-11" hoje="2026-11" progresso={1} compacto={false} />)
    expect(screen.getByRole('heading', { name: 'Ano em resumo · 2026' })).toBeInTheDocument()
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('dezembro ainda sem dados')
    const tabela = screen.getByRole('table', { name: 'Receitas e despesas por mês em 2026' })
    expect(within(tabela).getByRole('row', { name: /dezembro/ })).toHaveTextContent('sem dados')
  })
})

describe('CategoriasTreemap', () => {
  it('mostra só despesas, com percentual e as 5 maiores', () => {
    render(
      <CategoriasTreemap categorias={resumoNovembro.por_categoria} despesas={resumoNovembro.despesas} mes="2026-11" progresso={1} compacto={false} />,
    )
    expect(semNbsp(screen.getByRole('img').getAttribute('aria-label'))).toBe(
      'Mapa de árvore das despesas de novembro por categoria. Maior: Moradia, R$ 1.830,00 (49,3%).',
    )
    const top = screen.getByRole('table', { name: '5 maiores categorias de despesa' })
    expect(within(top).queryByText('Salário')).not.toBeInTheDocument()
    expect(within(top).getByRole('row', { name: /Mercado/ })).toHaveTextContent('22,8%')
  })

  it('sem despesas mostra mensagem', () => {
    render(<CategoriasTreemap categorias={[]} despesas="0.00" mes="2026-11" progresso={1} compacto={false} />)
    expect(screen.getByText('Nenhuma despesa neste mês.')).toBeInTheDocument()
  })
})
