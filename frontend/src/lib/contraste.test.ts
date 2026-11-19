import { describe, expect, it } from 'vitest'
import { contraste, misturar } from './contraste'

describe('contraste WCAG', () => {
  it('preto no branco é 21:1 e cor com ela mesma é 1:1', () => {
    expect(contraste('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
    expect(contraste('#FBF6EC', '#FBF6EC')).toBeCloseTo(1, 5)
  })

  it('valor conhecido: #767676 no branco ≈ 4,54:1', () => {
    expect(contraste('#767676', '#fff')).toBeCloseTo(4.54, 2)
  })

  it('a ordem das cores não importa', () => {
    expect(contraste('#142028', '#D5ECF3')).toBeCloseTo(contraste('#D5ECF3', '#142028'), 10)
  })

  it('misturar com alfa 0 e 1 devolve as pontas', () => {
    expect(misturar('#ffffff', '#000000', 0)).toBe('#ffffff')
    expect(misturar('#ffffff', '#000000', 1)).toBe('#000000')
  })
})
