// Cartão de métrica (docs/design/telas/app/painel/Painel.dc.html, `fazMetrica`).
// Adaptado do DashboardMetricCard do 21st.dev: em Despesas, subir é ruim (ADR-014).
import { ArrowDown, ArrowDownLeft, ArrowUp, ArrowUpRight, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Espiando } from '@/components/Personagem'
import { useEntrada, valorDaContagem } from '@/hooks/useEntrada'
import { compararComMesAnterior, type Metrica } from '@/lib/comparacao'
import { formatarComSinal, formatarSaldo, nomeDoMes } from '@/lib/format'
import type { Pose } from '@/lib/personagens'
import { cn } from '@/lib/utils'

const ROTULO: Record<Metrica, string> = { receita: 'Receitas', despesa: 'Despesas', saldo: 'Saldo' }
const TIPO_NA_URL: Record<Metrica, string | undefined> = { receita: 'RECEITA', despesa: 'DESPESA', saldo: undefined }

function formatar(metrica: Metrica, valor: string) {
  if (metrica === 'receita') return formatarComSinal(valor, 'RECEITA')
  if (metrica === 'despesa') return formatarComSinal(valor, 'DESPESA')
  return formatarSaldo(valor)
}

interface MetricCardProps {
  metrica: Metrica
  valor: string
  anterior: string
  mes: string
  mesAnterior: string
  /** Só o cartão Saldo tem o Papo espiando (desktop). */
  papo?: Pose | null
  animar?: boolean
}

export function MetricCard({ metrica, valor, anterior, mes, mesAnterior, papo = null, animar = true }: MetricCardProps) {
  const progresso = useEntrada(animar)
  const comparacao = compararComMesAnterior(metrica, valor, anterior)
  const nomeAnterior = nomeDoMes(mesAnterior)
  const negativo = valor.trim().startsWith('-')

  const textoComparacao =
    comparacao.direcao === 'sem-base'
      ? `Sem movimento em ${nomeAnterior} para comparar`
      : comparacao.direcao === 'igual'
        ? `${comparacao.percentual} vs ${nomeAnterior} · igual`
        : `${comparacao.percentual} vs ${nomeAnterior} · ${comparacao.frase}`

  const busca = new URLSearchParams({ mes })
  const tipo = TIPO_NA_URL[metrica]
  if (tipo) busca.set('tipo', tipo)

  const Icone = metrica === 'receita' ? ArrowDownLeft : metrica === 'despesa' ? ArrowUpRight : Wallet
  const preocupado = papo === 'papo-preocupado'

  return (
    <Espiando pose={papo} altura={preocupado ? 170 : 80} className="h-full">
      <Link
        to={`/transacoes?${busca.toString()}`}
        aria-label={`${ROTULO[metrica]} de ${nomeDoMes(mes)}: ${formatar(metrica, valor)}. ${textoComparacao}. Abrir transações filtradas.`}
        className="flex h-full min-h-11 flex-col gap-2.5 rounded-cartao bg-branco px-[22px] py-5 text-tinta no-underline shadow-cartao transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(20,32,40,0.06),0_14px_32px_rgba(20,32,40,0.1)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <span className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={cn(
              'flex size-9 items-center justify-center rounded-[10px]',
              metrica === 'receita' && 'bg-verde-ativo-bg text-receita',
              metrica === 'despesa' && 'bg-despesa-bg text-despesa',
              metrica === 'saldo' && 'bg-neutro-bg text-texto-3',
            )}
          >
            <Icone className="size-5" strokeWidth={2.2} />
          </span>
          <span className="text-[15px] font-bold">{ROTULO[metrica]}</span>
        </span>
        <span
          data-testid="valor"
          className={cn(
            'text-[28px] font-extrabold tracking-[-0.5px] whitespace-nowrap',
            metrica === 'receita' && 'text-receita',
            metrica === 'despesa' && 'text-despesa',
            metrica === 'saldo' && (negativo ? 'text-despesa' : 'text-tinta'),
          )}
        >
          {formatar(metrica, valorDaContagem(valor, progresso))}
        </span>
        <span
          data-testid="comparacao"
          className={cn(
            'flex items-center gap-1.5 text-[13px] font-semibold',
            comparacao.tom === 'bom' && 'text-receita',
            comparacao.tom === 'ruim' && 'text-despesa',
            comparacao.tom === 'neutro' && 'text-texto-2',
          )}
        >
          {comparacao.direcao === 'subiu' && <ArrowUp data-seta="subiu" className="size-4" strokeWidth={2.5} aria-hidden="true" />}
          {comparacao.direcao === 'desceu' && <ArrowDown data-seta="desceu" className="size-4" strokeWidth={2.5} aria-hidden="true" />}
          <span>{textoComparacao}</span>
        </span>
      </Link>
    </Espiando>
  )
}
