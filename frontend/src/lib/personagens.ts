// PNGs dos personagens fornecidos pelo autor (ADR-013). Nunca redesenhar nem gerar SVG.
import caranguejo from '@/assets/personagens/caranguejo.png'
import gaivota from '@/assets/personagens/gaivota.png'
import papoAnimado from '@/assets/papo/papo-animado.png'
import papoCadeiraAcenando from '@/assets/papo/papo-cadeira-acenando.png'
import papoEspiandoLado from '@/assets/papo/papo-espiando-lado.png'
import papoEspiando from '@/assets/papo/papo-espiando.png'
import papoJoinha from '@/assets/papo/papo-joinha.png'
import papoPreocupado from '@/assets/papo/papo-preocupado.png'
import papoSentadoMoeda from '@/assets/papo/papo-sentado-moeda.png'

export const PERSONAGENS = {
  'papo-animado': papoAnimado,
  'papo-cadeira-acenando': papoCadeiraAcenando,
  'papo-espiando-lado': papoEspiandoLado,
  'papo-espiando': papoEspiando,
  'papo-joinha': papoJoinha,
  'papo-preocupado': papoPreocupado,
  'papo-sentado-moeda': papoSentadoMoeda,
  caranguejo,
  gaivota,
} as const

export type Pose = keyof typeof PERSONAGENS

/** Altura máxima visível do efeito "espiando" acima da borda do cartão (decisoes-de-design, seção 6). */
export const ESPIANDO_VISIVEL_PX = 72
