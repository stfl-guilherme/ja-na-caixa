// Formatação de exibição. O front não soma dinheiro: totais vêm do backend (ADR-005).

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Formata um valor decimal vindo da API ("1234.56") como moeda brasileira. */
export function formatarMoeda(valor: string | number): string {
  return moeda.format(Number(valor))
}

const COM_MILHAR = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/
const SEM_MILHAR = /^\d+(,\d{1,2})?$/

/**
 * Converte a entrada do usuário no formato brasileiro ("1.234,56") para a string
 * decimal aceita pela API ("1234.56"). Retorna null se a entrada for inválida ou <= 0.
 */
export function parseValorBR(entrada: string): string | null {
  const texto = entrada.replace(/R\$/g, '').trim()
  if (!COM_MILHAR.test(texto) && !SEM_MILHAR.test(texto)) return null
  const [inteiro, centavos = ''] = texto.replace(/\./g, '').split(',')
  const normalizado = `${inteiro.replace(/^0+(?=\d)/, '')}.${centavos.padEnd(2, '0')}`
  if (/^0\.00$/.test(normalizado)) return null
  return normalizado
}

/** Converte o valor da API ("1234.56") para edição no formato brasileiro ("1.234,56"). */
export function valorParaInput(valor: string): string {
  const [inteiro, centavos = '00'] = valor.split('.')
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${comMilhar},${centavos.padEnd(2, '0').slice(0, 2)}`
}

/** "2026-11-17" → "17/11/2026", sem converter fuso horário. */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

const NOMES_MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

/** "2026-11" → "novembro de 2026". */
export function formatarMes(mes: string): string {
  const [ano, numero] = mes.split('-').map(Number)
  return `${NOMES_MESES[numero - 1]} de ${ano}`
}

/** Mês ("AAAA-MM") da data informada, no fuso local. */
export function mesAtual(data: Date = new Date()): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
}

/** Soma `delta` meses a "AAAA-MM". */
export function deslocarMes(mes: string, delta: number): string {
  const [ano, numero] = mes.split('-').map(Number)
  return mesAtual(new Date(ano, numero - 1 + delta, 1))
}

/** Data de hoje no formato ISO local ("AAAA-MM-DD"). */
export function hojeISO(data: Date = new Date()): string {
  return `${mesAtual(data)}-${String(data.getDate()).padStart(2, '0')}`
}
