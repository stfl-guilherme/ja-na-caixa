// Funções puras dos gráficos do Painel (docs/design/telas/app/painel/Painel.dc.html).
// Trabalham com números só para desenhar: escala, posição e área. Nenhum total é calculado aqui.

export interface ItemArea {
  v: number
}
export type Bloco<T> = T & { x: number; y: number; w: number; h: number }

/** Treemap "squarified" (Bruls et al.), igual ao `squarify()` do design. */
export function squarify<T extends ItemArea>(itens: T[], W: number, H: number): Bloco<T>[] {
  const total = itens.reduce((s, i) => s + i.v, 0)
  if (!itens.length || total <= 0) return []
  const saida: Bloco<T>[] = []
  type ComArea = T & { a: number }
  const pior = (linha: ComArea[], lado: number) => {
    const s = linha.reduce((acc, r) => acc + r.a, 0)
    const mx = Math.max(...linha.map((r) => r.a))
    const mn = Math.min(...linha.map((r) => r.a))
    return Math.max((lado * lado * mx) / (s * s), (s * s) / (lado * lado * mn))
  }
  const montar = (lista: ComArea[], x: number, y: number, w: number, h: number) => {
    if (!lista.length) return
    const tirarArea = ({ a: _a, ...resto }: ComArea) => resto as unknown as T
    if (lista.length === 1) {
      saida.push({ ...tirarArea(lista[0]), x, y, w, h })
      return
    }
    const lado = Math.min(w, h)
    const linha = [lista[0]]
    let i = 1
    while (i < lista.length && pior([...linha, lista[i]], lado) <= pior(linha, lado)) linha.push(lista[i++])
    const s = linha.reduce((acc, r) => acc + r.a, 0)
    if (w >= h) {
      const cw = s / h
      let yy = y
      linha.forEach((r) => {
        const rh = r.a / cw
        saida.push({ ...tirarArea(r), x, y: yy, w: cw, h: rh })
        yy += rh
      })
      montar(lista.slice(i), x + cw, y, w - cw, h)
    } else {
      const rh = s / w
      let xx = x
      linha.forEach((r) => {
        const rw = r.a / rh
        saida.push({ ...tirarArea(r), x: xx, y, w: rw, h: rh })
        xx += rw
      })
      montar(lista.slice(i), x, y + rh, w, h - rh)
    }
  }
  montar(
    itens.map((it) => ({ ...it, a: (it.v / total) * W * H })),
    0,
    0,
    W,
    H,
  )
  return saida
}

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const TINTA = '#142028'

/** Branco ou tinta, o que tiver mais contraste com o fundo (WCAG). */
export function textoSobre(fundo: string): '#FFFFFF' | typeof TINTA {
  const l = luminancia(fundo)
  const contrasteBranco = 1.05 / (l + 0.05)
  const contrasteTinta = (l + 0.05) / (luminancia(TINTA) + 0.05)
  return contrasteBranco >= contrasteTinta ? '#FFFFFF' : TINTA
}

const PASSOS = [500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000]

/** Escala do gráfico de saldo: até 4 faixas, sempre incluindo o zero. */
export function escalaSaldo(valores: number[]) {
  const max = Math.max(...valores, 0)
  const min = Math.min(...valores, 0)
  const passo = PASSOS.find((p) => (max - min) / p <= 4) ?? PASSOS[PASSOS.length - 1]
  const topo = Math.max(passo, Math.ceil(max / passo) * passo)
  const base = Math.floor(min / passo) * passo
  return { topo, base: base === 0 ? 0 : base, passo }
}

/** Topo "redondo" para os gráficos de barras (múltiplo de 1000). */
export function topoRedondo(maximo: number, multiplo = 1000) {
  return Math.max(multiplo, Math.ceil(maximo / multiplo) * multiplo)
}

/** Rótulos do eixo de dias: 1, 5, 10, …, e o último dia do mês. */
export function rotulosDosDias(totalDias: number, posicao: (dia: number) => number) {
  return [1, 5, 10, 15, 20, 25, totalDias]
    .filter((d, i, lista) => d <= totalDias && lista.indexOf(d) === i && !(d !== totalDias && totalDias - d < 3))
    .map((d) => ({ esquerda: posicao(d), texto: String(d) }))
}
