// Contraste WCAG 2.x entre duas cores hexadecimais (#RGB ou #RRGGBB).

function canais(hex: string): [number, number, number] {
  let h = hex.trim().replace('#', '')
  if (h.length === 3) h = [...h].map((c) => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`Cor inválida: ${hex}`)
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}

/** Luminância relativa (WCAG 2.x). */
export function luminancia(hex: string) {
  const [r, g, b] = canais(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Razão de contraste, de 1 a 21. */
export function contraste(a: string, b: string) {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (claro + 0.05) / (escuro + 0.05)
}

/** Cor `cima` com opacidade `alfa` sobre `fundo` (composição simples). */
export function misturar(fundo: string, cima: string, alfa: number) {
  const f = canais(fundo)
  const c = canais(cima)
  return '#' + f.map((v, i) => Math.round(v * (1 - alfa) + c[i] * alfa).toString(16).padStart(2, '0')).join('')
}
