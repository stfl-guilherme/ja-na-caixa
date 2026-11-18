import { describe, expect, it } from 'vitest'
import {
  deslocarMes,
  formatarData,
  formatarMes,
  formatarMoeda,
  mesAtual,
  parseValorBR,
  valorParaInput,
} from './format'

// Intl usa espaço não separável entre "R$" e o número.
const semNbsp = (texto: string) => texto.replace(/ /g, ' ')

describe('formatarMoeda', () => {
  it.each([
    ['1234.5', 'R$ 1.234,50'],
    ['0.30', 'R$ 0,30'],
    ['1000000', 'R$ 1.000.000,00'],
    ['-2189.55', '-R$ 2.189,55'],
  ])('formata %s como %s', (entrada, esperado) => {
    expect(semNbsp(formatarMoeda(entrada))).toBe(esperado)
  })
})

describe('parseValorBR', () => {
  it.each([
    ['1.234,56', '1234.56'],
    ['1234,56', '1234.56'],
    ['1234,5', '1234.50'],
    ['1234', '1234.00'],
    ['0,01', '0.01'],
    ['1.000.000', '1000000.00'],
    [' R$ 12,30 ', '12.30'],
  ])('converte %s em %s', (entrada, esperado) => {
    expect(parseValorBR(entrada)).toBe(esperado)
  })

  it.each(['', '   ', 'abc', '1,2,3', '-5', '0', '0,00', '12,345', '1.23,45', '12.5', '1..000'])(
    'rejeita %j',
    (entrada) => {
      expect(parseValorBR(entrada)).toBeNull()
    },
  )
})

describe('valorParaInput', () => {
  it('converte o valor da API para o formato brasileiro', () => {
    expect(valorParaInput('1234.56')).toBe('1.234,56')
    expect(valorParaInput('10.00')).toBe('10,00')
  })
})

describe('datas e meses', () => {
  it('formata data ISO sem depender de fuso', () => {
    expect(formatarData('2026-11-17')).toBe('17/11/2026')
  })

  it('formata o mês por extenso', () => {
    expect(formatarMes('2026-11')).toBe('novembro de 2026')
  })

  it('calcula o mês atual a partir de uma data', () => {
    expect(mesAtual(new Date(2026, 0, 31))).toBe('2026-01')
  })

  it('desloca meses atravessando o ano', () => {
    expect(deslocarMes('2026-01', -1)).toBe('2025-12')
    expect(deslocarMes('2026-12', 1)).toBe('2027-01')
    expect(deslocarMes('2026-11', 0)).toBe('2026-11')
  })
})
