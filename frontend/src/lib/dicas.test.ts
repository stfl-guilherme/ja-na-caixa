import { describe, expect, it } from 'vitest'
import { fotosDoBotao } from './dicas'

describe('fotosDoBotao', () => {
  it('usa a foto preferida de cada tipo', () => {
    expect(fotosDoBotao(['alerta', 'parabens', 'info'])).toEqual(['papo-preocupado', 'papo-joinha', 'papo-sentado-moeda'])
    expect(fotosDoBotao(['primeiros_passos'])).toEqual(['papo-animado'])
  })

  it('tipos repetidos ganham fotos diferentes', () => {
    const fotos = fotosDoBotao(['alerta', 'info', 'info'])
    expect(new Set(fotos).size).toBe(3)
    expect(fotosDoBotao(['alerta', 'alerta', 'alerta'])).toEqual(['papo-preocupado', 'papo-animado', 'papo-espiando-lado'])
  })
})
