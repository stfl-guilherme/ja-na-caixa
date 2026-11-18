import { describe, expect, it } from 'vitest'
import { escalaSaldo, squarify, textoSobre } from './graficos'

describe('squarify', () => {
  const itens = [6, 6, 4, 3, 2, 2, 1].map((v, i) => ({ id: i, v }))
  const blocos = squarify(itens, 160, 100)

  it('cobre a área inteira, proporcional aos valores', () => {
    const area = blocos.reduce((soma, b) => soma + b.w * b.h, 0)
    expect(area).toBeCloseTo(160 * 100, 6)
    const total = itens.reduce((s, i) => s + i.v, 0)
    blocos.forEach((b) => expect(b.w * b.h).toBeCloseTo((b.v / total) * 16000, 6))
  })

  it('não sobrepõe blocos e fica dentro do retângulo', () => {
    const eps = 1e-9
    blocos.forEach((a, i) => {
      expect(a.x).toBeGreaterThanOrEqual(-eps)
      expect(a.y).toBeGreaterThanOrEqual(-eps)
      expect(a.x + a.w).toBeLessThanOrEqual(160 + eps)
      expect(a.y + a.h).toBeLessThanOrEqual(100 + eps)
      blocos.slice(i + 1).forEach((b) => {
        const sobreX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
        const sobreY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
        expect(sobreX <= eps || sobreY <= eps).toBe(true)
      })
    })
  })

  it('lista vazia não gera blocos', () => {
    expect(squarify([], 160, 100)).toEqual([])
  })
})

describe('textoSobre', () => {
  it('escolhe a cor de texto com mais contraste', () => {
    expect(textoSobre('#2F6FB2')).toBe('#FFFFFF')
    expect(textoSobre('#8C6A0C')).toBe('#FFFFFF')
    expect(textoSobre('#F8D428')).toBe('#142028')
    expect(textoSobre('#FFFFFF')).toBe('#142028')
  })
})

describe('escalaSaldo', () => {
  it('arredonda para passos legíveis e inclui o zero', () => {
    expect(escalaSaldo([3750, 3370, 2974.61])).toEqual({ topo: 4000, base: 0, passo: 1000 })
    const negativa = escalaSaldo([3750, -625.39])
    expect(negativa.base).toBeLessThan(0)
    expect(negativa.topo).toBeGreaterThanOrEqual(3750)
  })

  it('mês zerado ainda tem uma escala', () => {
    expect(escalaSaldo([0, 0])).toEqual({ topo: 500, base: 0, passo: 500 })
  })
})
