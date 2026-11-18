import { apiParaCentavos } from './mascaras'

export type Metrica = 'receita' | 'despesa' | 'saldo'

export interface Comparacao {
  direcao: 'subiu' | 'desceu' | 'igual' | 'sem-base'
  /** bom = verde, ruim = vermelho. Em Despesas, subir é ruim. */
  tom: 'bom' | 'ruim' | 'neutro'
  percentual: string | null
  frase: string | null
}

const FRASES: Record<Metrica, [string, string]> = {
  receita: ['ganhou mais', 'ganhou menos'],
  despesa: ['gastou mais', 'gastou menos'],
  saldo: ['sobrou mais', 'sobrou menos'],
}

const pct = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function centavosComSinal(valor: string): number {
  return (valor.trim().startsWith('-') ? -1 : 1) * apiParaCentavos(valor.trim())
}

/**
 * Compara o mês com o anterior. Os totais vêm prontos do backend; aqui só se
 * calcula o percentual de variação, que é exibição (spec 6.5).
 */
export function compararComMesAnterior(metrica: Metrica, atual: string, anterior: string): Comparacao {
  const agora = centavosComSinal(atual)
  const antes = centavosComSinal(anterior)
  if (antes === 0) return { direcao: 'sem-base', tom: 'neutro', percentual: null, frase: null }
  const variacao = ((agora - antes) / Math.abs(antes)) * 100
  const percentual = `${pct.format(Math.abs(variacao))}%`
  if (agora === antes) return { direcao: 'igual', tom: 'neutro', percentual, frase: null }
  const subiu = agora > antes
  const bom = metrica === 'despesa' ? !subiu : subiu
  return {
    direcao: subiu ? 'subiu' : 'desceu',
    tom: bom ? 'bom' : 'ruim',
    percentual,
    frase: FRASES[metrica][subiu ? 0 : 1],
  }
}
