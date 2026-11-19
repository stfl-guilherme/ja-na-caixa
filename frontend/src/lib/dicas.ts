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

/**
 * Fotos do botão flutuante (spec 17.2): preferência por tipo e uma foto diferente por dica.
 * Se a preferida já foi usada por uma dica anterior, usa a próxima livre da lista.
 */
const FOTOS_DO_BOTAO: Record<TipoDica, Pose[]> = {
  // O espiando de lado é meio rosto (fica cortado no círculo): só como último recurso.
  alerta: ['papo-preocupado', 'papo-animado', 'papo-espiando-lado'],
  parabens: ['papo-joinha', 'papo-animado', 'papo-sentado-moeda'],
  info: ['papo-sentado-moeda', 'papo-animado', 'papo-espiando-lado'],
  primeiros_passos: ['papo-animado', 'papo-sentado-moeda', 'papo-espiando-lado'],
}

export function fotosDoBotao(tipos: TipoDica[]): Pose[] {
  const usadas = new Set<Pose>()
  return tipos.map((tipo) => {
    const lista = FOTOS_DO_BOTAO[tipo]
    const foto = lista.find((p) => !usadas.has(p)) ?? lista[0]
    usadas.add(foto)
    return foto
  })
}
