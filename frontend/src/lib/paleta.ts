// 10 cores de categoria do design (--jnc-cat-* em styles/tokens.css), todas ≥ 4,9:1 com texto branco.
export const PALETA = [
  { hex: '#2F6FB2', nome: 'Azul' },
  { hex: '#B5541A', nome: 'Laranja' },
  { hex: '#7B5CC4', nome: 'Roxo' },
  { hex: '#8C6A0C', nome: 'Mostarda' },
  { hex: '#1F7A70', nome: 'Petróleo' },
  { hex: '#C2416A', nome: 'Rosa' },
  { hex: '#557280', nome: 'Ardósia' },
  { hex: '#2F7D35', nome: 'Verde' },
  { hex: '#8A5A2E', nome: 'Marrom' },
  { hex: '#A54F98', nome: 'Magenta' },
] as const

export function nomeDaCor(hex: string): string {
  return PALETA.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.nome ?? 'personalizada'
}
