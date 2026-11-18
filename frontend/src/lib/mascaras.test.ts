import { describe, expect, it } from 'vitest'
import {
  apiParaCentavos,
  centavosDeDigitos,
  centavosParaApi,
  dataBRParaISO,
  formatarCentavos,
  isoParaDataBR,
  mascararData,
} from './mascaras'

describe('máscara de valor em centavos', () => {
  it('monta os centavos a partir dos dígitos digitados', () => {
    expect(centavosDeDigitos('')).toBe(0)
    expect(centavosDeDigitos('5')).toBe(5)
    expect(centavosDeDigitos('123456')).toBe(123456)
    expect(centavosDeDigitos('R$ 1.234,56')).toBe(123456)
  })

  it('limita a 11 dígitos (até R$ 999.999.999,99)', () => {
    expect(centavosDeDigitos('1234567890123')).toBe(12345678901)
  })

  it('exibe sem perder centavos', () => {
    expect(formatarCentavos(0)).toBe('0,00')
    expect(formatarCentavos(5)).toBe('0,05')
    expect(formatarCentavos(123456)).toBe('1.234,56')
    expect(formatarCentavos(99999999999)).toBe('999.999.999,99')
  })

  it('converte para o formato da API e de volta, com inteiros', () => {
    expect(centavosParaApi(123456)).toBe('1234.56')
    expect(centavosParaApi(30)).toBe('0.30')
    expect(apiParaCentavos('1234.56')).toBe(123456)
    expect(apiParaCentavos('0.10')).toBe(10)
    expect(apiParaCentavos('4500')).toBe(450000)
  })
})

describe('máscara de data', () => {
  it.each([
    ['1', '1'],
    ['17', '17'],
    ['171', '17/1'],
    ['1711', '17/11'],
    ['17112', '17/11/2'],
    ['17112026', '17/11/2026'],
    ['17/11/2026', '17/11/2026'],
    ['171120269', '17/11/2026'],
  ])('%s vira %s', (entrada, esperado) => {
    expect(mascararData(entrada)).toBe(esperado)
  })

  it('converte dd/mm/aaaa para ISO, rejeitando datas impossíveis', () => {
    expect(dataBRParaISO('17/11/2026')).toBe('2026-11-17')
    expect(dataBRParaISO('29/02/2028')).toBe('2028-02-29')
    expect(dataBRParaISO('29/02/2026')).toBeNull()
    expect(dataBRParaISO('31/04/2026')).toBeNull()
    expect(dataBRParaISO('00/11/2026')).toBeNull()
    expect(dataBRParaISO('17/13/2026')).toBeNull()
    expect(dataBRParaISO('17/11/26')).toBeNull()
  })

  it('converte ISO para dd/mm/aaaa', () => {
    expect(isoParaDataBR('2026-11-05')).toBe('05/11/2026')
  })
})
