import type { DiaDoMes, Resumo, ResumoAnual } from '@/api/types'

/** Série de 30 dias com saldo acumulado já calculado (como o backend devolve). */
export function serieNovembro(movimentos: Record<number, [string, string, string]> = {}): DiaDoMes[] {
  let ultimo = '0.00'
  return Array.from({ length: 30 }, (_, i) => {
    const dia = i + 1
    const [receitas, despesas, acumulado] = movimentos[dia] ?? ['0.00', '0.00', ultimo]
    ultimo = acumulado
    return { data: `2026-11-${String(dia).padStart(2, '0')}`, receitas, despesas, saldo_acumulado: acumulado }
  })
}

export const resumoNovembro: Resumo = {
  mes: '2026-11',
  receitas: '6686.42',
  despesas: '3711.81',
  saldo: '2974.61',
  por_categoria: [
    { categoria_id: 1, nome: 'Salário', cor: '#2F7D35', tipo: 'RECEITA', total: '5200.00', quantidade: 1 },
    { categoria_id: 2, nome: 'Moradia', cor: '#2F6FB2', tipo: 'DESPESA', total: '1830.00', quantidade: 2 },
    { categoria_id: 3, nome: 'Mercado', cor: '#B5541A', tipo: 'DESPESA', total: '844.55', quantidade: 4 },
    { categoria_id: 4, nome: 'Lazer', cor: '#8C6A0C', tipo: 'DESPESA', total: '306.40', quantidade: 4 },
  ],
  mes_anterior: { mes: '2026-10', receitas: '6420.00', despesas: '4105.60', saldo: '2314.40' },
  serie_diaria: serieNovembro({
    1: ['5200.00', '1450.00', '3750.00'],
    2: ['0.00', '380.00', '3370.00'],
    17: ['0.00', '81.60', '2974.61'],
  }),
}

export const resumoAnual2026: ResumoAnual = {
  ano: 2026,
  receitas: '71000.00',
  despesas: '54107.41',
  saldo: '16892.59',
  meses: Array.from({ length: 12 }, (_, i) => {
    const mes = `2026-${String(i + 1).padStart(2, '0')}`
    return i < 11
      ? { mes, receitas: '6100.00', despesas: '4890.00', saldo: '1210.00' }
      : { mes, receitas: '0.00', despesas: '0.00', saldo: '0.00' }
  }),
}
