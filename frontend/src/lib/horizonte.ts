// Geometria da faixa de horizonte (components/layout/HorizonteHeader.tsx).

/** Altura da faixa em px. */
export const ALTURA_HORIZONTE = { desktop: 160, mobile: 110 } as const

// Sistema de coordenadas das faixas: 1000 × 100 (y em % da altura), esticado com
// preserveAspectRatio="none". Céu 0–55, mar 55–85 (mar-1 até ~65, crista, mar-2), espuma 85–89,
// areia 89–100. A areia não é pintada: o fundo da própria página aparece (mesma cor e textura).
export const LARGURA = 1000

/** Linha ondulada suave de x=0 a x=1000 em torno de `y`, fechada para baixo até `base`. */
export function caminhoOnda(y: number, amplitude: number, ondas: number, base: number) {
  const passo = LARGURA / (ondas * 2)
  let d = `M0 ${y}`
  for (let i = 0; i < ondas * 2; i++) {
    const x0 = i * passo
    const sentido = i % 2 === 0 ? -1 : 1
    d += ` Q${x0 + passo / 2} ${y + sentido * amplitude * 2} ${x0 + passo} ${y}`
  }
  return `${d} L${LARGURA} ${base} L0 ${base} Z`
}
