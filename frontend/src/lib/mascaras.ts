// Máscaras do modal de transação (docs/design/telas/app/transacoes/Transacoes.dc.html).
// Valores em centavos inteiros: nada de float no caminho do dinheiro.

const MAX_DIGITOS_VALOR = 11

/** O usuário digita só números; os dois últimos são os centavos. */
export function centavosDeDigitos(texto: string): number {
  const digitos = texto.replace(/\D/g, '').slice(0, MAX_DIGITOS_VALOR)
  return digitos ? Number.parseInt(digitos, 10) : 0
}

function comMilhar(inteiro: string): string {
  return inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** 123456 → "1.234,56". */
export function formatarCentavos(centavos: number): string {
  const reais = Math.floor(centavos / 100)
  const resto = String(centavos % 100).padStart(2, '0')
  return `${comMilhar(String(reais))},${resto}`
}

/** 123456 → "1234.56" (formato da API). */
export function centavosParaApi(centavos: number): string {
  return `${Math.floor(centavos / 100)}.${String(centavos % 100).padStart(2, '0')}`
}

/** "1234.56" → 123456, por manipulação de texto. */
export function apiParaCentavos(valor: string): number {
  const [inteiro, fracao = ''] = valor.replace(/^-/, '').split('.')
  return Number.parseInt(inteiro || '0', 10) * 100 + Number.parseInt((fracao + '00').slice(0, 2), 10)
}

/** Mantém só dígitos e insere as barras: "17112026" → "17/11/2026". */
export function mascararData(texto: string): string {
  const d = texto.replace(/\D/g, '').slice(0, 8)
  if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`
  return d
}

/** "17/11/2026" → "2026-11-17"; `null` se o formato ou a data forem inválidos. */
export function dataBRParaISO(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto)
  if (!m) return null
  const [dia, mes, ano] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const data = new Date(ano, mes - 1, dia)
  if (ano < 1 || data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

/** "2026-11-05" → "05/11/2026". */
export function isoParaDataBR(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}
