// Pose e rótulo de cada tipo de dica (spec 17.2; decisoes-de-design, seção 6).
import type { TipoDica } from '@/api/types'
import type { Pose } from '@/lib/personagens'

export const POSE_DA_DICA: Record<TipoDica, Pose> = {
  alerta: 'papo-preocupado',
  parabens: 'papo-joinha',
  info: 'papo-espiando',
  primeiros_passos: 'papo-espiando',
}

/** O tipo também aparece em texto: a pose do Papo nunca é o único sinal. */
export const ROTULO_DA_DICA: Record<TipoDica, string> = {
  alerta: 'Alerta',
  info: 'Para saber',
  parabens: 'Parabéns',
  primeiros_passos: 'Primeiros passos',
}

export function rotuloDoLink(link: string) {
  return link.startsWith('/categorias') ? 'Ver categorias' : 'Ver transações'
}
