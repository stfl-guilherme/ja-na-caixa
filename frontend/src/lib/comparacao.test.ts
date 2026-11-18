import { describe, expect, it } from 'vitest'
import { compararComMesAnterior } from './comparacao'

describe('compararComMesAnterior', () => {
  it('em Despesas, aumento é ruim (vermelho)', () => {
    const c = compararComMesAnterior('despesa', '4500.00', '4000.00')
    expect(c).toMatchObject({ direcao: 'subiu', tom: 'ruim', percentual: '12,5%', frase: 'gastou mais' })
  })

  it('em Despesas, queda é boa (verde)', () => {
    const c = compararComMesAnterior('despesa', '3711.81', '4105.60')
    expect(c).toMatchObject({ direcao: 'desceu', tom: 'bom', percentual: '9,6%', frase: 'gastou menos' })
  })

  it('em Receitas, aumento é bom e queda é ruim', () => {
    expect(compararComMesAnterior('receita', '6686.42', '6420.00')).toMatchObject({
      direcao: 'subiu',
      tom: 'bom',
      frase: 'ganhou mais',
    })
    expect(compararComMesAnterior('receita', '100.00', '200.00')).toMatchObject({
      direcao: 'desceu',
      tom: 'ruim',
      frase: 'ganhou menos',
    })
  })

  it('no Saldo, mede contra o valor absoluto do mês anterior', () => {
    expect(compararComMesAnterior('saldo', '2974.61', '2314.40')).toMatchObject({
      direcao: 'subiu',
      tom: 'bom',
      percentual: '28,5%',
      frase: 'sobrou mais',
    })
    expect(compararComMesAnterior('saldo', '-625.39', '2314.40')).toMatchObject({ direcao: 'desceu', tom: 'ruim', frase: 'sobrou menos' })
    expect(compararComMesAnterior('saldo', '100.00', '-200.00')).toMatchObject({ direcao: 'subiu', percentual: '150,0%' })
  })

  it('sem movimento no mês anterior não inventa percentual', () => {
    expect(compararComMesAnterior('despesa', '100.00', '0.00')).toEqual({ direcao: 'sem-base', tom: 'neutro', percentual: null, frase: null })
  })

  it('valores iguais são neutros', () => {
    expect(compararComMesAnterior('despesa', '100.00', '100.00')).toMatchObject({ direcao: 'igual', tom: 'neutro', percentual: '0,0%' })
  })
})
