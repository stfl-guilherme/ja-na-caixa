// Painel (docs/design/telas/app/painel/Painel.dc.html): bento de 12 colunas no desktop, uma coluna no celular.
import { ChevronRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EstadoErro } from '@/components/Estados'
import { CabecalhoPagina } from '@/components/layout/CabecalhoPagina'
import { useInterface, useOcultarPapoDoMenu } from '@/components/layout/contexto'
import { AnoBarChart } from '@/components/painel/AnoBarChart'
import { CategoriasTreemap } from '@/components/painel/CategoriasTreemap'
import { FluxoEspelhadoChart } from '@/components/painel/FluxoEspelhadoChart'
import { MetricCard } from '@/components/painel/MetricCard'
import { SecaoPainel } from '@/components/painel/partes'
import { SaldoLineChart } from '@/components/painel/SaldoLineChart'
import { Personagem } from '@/components/Personagem'
import { ValorTransacao } from '@/components/ValorTransacao'
import { botao } from '@/components/ui/botao'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategorias } from '@/hooks/useCategorias'
import { useEntrada } from '@/hooks/useEntrada'
import { useMesSelecionado } from '@/hooks/useMesSelecionado'
import { useResumo, useResumoAnual } from '@/hooks/useResumo'
import { useTelaLarga } from '@/hooks/useTelaLarga'
import { useTransacoes } from '@/hooks/useTransacoes'
import type { Resumo } from '@/api/types'
import { formatarData, hojeISO, mesAtual, nomeDoMes } from '@/lib/format'
import { cn } from '@/lib/utils'

function semMovimento(resumo: Resumo) {
  return resumo.por_categoria.length === 0
}

/** No mês corrente a linha vai até hoje; em meses passados, até o último dia. */
function diasDesenhados(mes: string, totalDias: number) {
  const atual = mesAtual()
  if (mes === atual) return Number(hojeISO().slice(8))
  return totalDias
}

function UltimasTransacoes({ mes }: { mes: string }) {
  const { comMes } = useMesSelecionado()
  const ultimas = useTransacoes({ mes, page: 1 })
  return (
    <SecaoPainel
      id="t-ultimas"
      titulo="Últimas transações"
      className="flex h-full flex-col"
      extra={
        <Link to={comMes('/transacoes')} className="inline-flex min-h-11 items-center gap-1 px-1 text-sm font-bold text-verde-700 no-underline">
          Ver todas
          <ChevronRight className="size-4" strokeWidth={2.5} aria-hidden="true" />
        </Link>
      }
    >
      {ultimas.isPending ? (
        <div className="grid gap-2" aria-label="Carregando">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10 bg-esqueleto-1" />
          ))}
        </div>
      ) : ultimas.error ? (
        <EstadoErro erro={ultimas.error} onTentarNovamente={() => ultimas.refetch()} />
      ) : ultimas.data.results.length === 0 ? (
        <p className="m-0 py-8 text-center text-sm font-medium text-texto-2">Nenhuma transação neste mês.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {ultimas.data.results.slice(0, 5).map((t, i) => (
            <li key={t.id} className={cn('flex items-center gap-3 py-[11px]', i > 0 && 'border-t border-divisor')}>
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: t.categoria_cor }} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-bold">{t.descricao}</span>
                <span className="text-xs font-medium text-texto-2">
                  {t.categoria_nome} · {formatarData(t.data)}
                </span>
              </span>
              <ValorTransacao valor={t.valor} tipo={t.tipo} className="text-sm" />
            </li>
          ))}
        </ul>
      )}
    </SecaoPainel>
  )
}

const PASSOS = [
  { titulo: '1. Crie uma categoria', descricao: 'Ex.: Salário para o que entra, Mercado para o que sai.', acao: 'Criar categoria' },
  { titulo: '2. Lance sua primeira transação', descricao: 'Escolha a categoria, o valor e a data.', acao: 'Lançar transação' },
]

/** Onboarding do modo vazio (spec, seção 8): passo atual destacado, com botão para ele. */
function PrimeirosPassos({ passoAtual }: { passoAtual: 0 | 1 }) {
  const { abrirCategoria, abrirTransacao } = useInterface()
  return (
    <ol aria-label="Primeiros passos" className="m-0 grid w-full max-w-[560px] list-none gap-3 p-0 text-left">
      {PASSOS.map((passo, i) => {
        const atual = i === passoAtual
        const feito = i < passoAtual
        return (
          <li
            key={passo.titulo}
            aria-current={atual ? 'step' : undefined}
            className={cn(
              'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-cartao px-4 py-3.5',
              atual ? 'border-2 border-verde-700 bg-verde-ativo-bg' : 'border border-borda-sutil bg-branco',
            )}
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <strong className={cn('text-base font-extrabold', !atual && 'text-texto-2')}>
                {passo.titulo}
                {feito && <span className="ml-2 text-sm font-bold text-receita">✓ feito</span>}
              </strong>
              <span className="text-[13px] font-medium text-texto-2">{passo.descricao}</span>
            </span>
            {atual && (
              <button type="button" onClick={() => (i === 0 ? abrirCategoria() : abrirTransacao())} className={botao({ tipo: 'primario' })}>
                <Plus strokeWidth={2.5} aria-hidden="true" />
                {passo.acao}
              </button>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function EstadoVazioPainel({ mes, larga, passoAtual }: { mes: string; larga: boolean; passoAtual: 0 | 1 | null }) {
  const { abrirTransacao } = useInterface()
  return (
    <section
      aria-labelledby="vazio-titulo"
      className={cn('flex flex-col items-center gap-[18px] rounded-cartao bg-branco text-center shadow-cartao', larga ? 'px-8 py-14' : 'px-5 py-7')}
    >
      <div className="flex items-end gap-1">
        <Personagem pose="papo-cadeira-acenando" altura={larga ? 220 : 150} />
        <Personagem pose="caranguejo" altura={larga ? 84 : 58} />
      </div>
      {passoAtual !== null ? (
        <>
          <h2 id="vazio-titulo" className="m-0 text-[22px] leading-[1.3] font-extrabold">
            Bem-vindo! Vamos montar seu painel?
          </h2>
          <p className="m-0 max-w-[420px] text-[15px] leading-normal font-medium text-texto-2">
            São só dois passos. Depois disso, os gráficos aparecem sozinhos.
          </p>
          <PrimeirosPassos passoAtual={passoAtual} />
        </>
      ) : (
        <>
          <h2 id="vazio-titulo" className="m-0 text-[22px] leading-[1.3] font-extrabold">
            Nada lançado em {nomeDoMes(mes)}. Bora começar?
          </h2>
          <p className="m-0 max-w-[420px] text-[15px] leading-normal font-medium text-texto-2">
            Registre a primeira receita ou despesa do mês e o painel se monta sozinho.
          </p>
          <button type="button" onClick={() => abrirTransacao()} className={botao({ tipo: 'primario' })}>
            <Plus strokeWidth={2.5} aria-hidden="true" />
            <span>Nova transação</span>
          </button>
        </>
      )}
    </section>
  )
}

export default function DashboardPage() {
  const larga = useTelaLarga()
  const { mes } = useMesSelecionado()
  const resumo = useResumo(mes)
  const categorias = useCategorias()
  // Sem categoria: passo 1. Com categoria mas sem nenhuma transação em nenhum mês: passo 2.
  const passoAtual: 0 | 1 | null = !categorias.data
    ? null
    : categorias.data.length === 0
      ? 0
      : categorias.data.every((c) => c.transacoes === 0)
        ? 1
        : null
  const anual = useResumoAnual(Number(mes.slice(0, 4)))
  const progresso = useEntrada()

  const vazio = resumo.data ? semMovimento(resumo.data) : false
  useOcultarPapoDoMenu(vazio)

  const negativo = resumo.data?.saldo.trim().startsWith('-') ?? false
  const papoSaldo = negativo ? 'papo-preocupado' : 'papo-espiando'
  const compacto = !larga

  return (
    <>
      <CabecalhoPagina
        titulo="Painel"
        extraMobile={!vazio && <Personagem pose={papoSaldo} altura={negativo ? 60 : 35} className="mb-px shrink-0" />}
      />

      {resumo.isPending ? (
        <div className="grid gap-4 largo:grid-cols-3 largo:gap-6" aria-label="Carregando">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-cartao bg-esqueleto-1" />
          ))}
        </div>
      ) : resumo.error ? (
        <EstadoErro erro={resumo.error} onTentarNovamente={() => resumo.refetch()} />
      ) : vazio ? (
        <EstadoVazioPainel mes={mes} larga={larga} passoAtual={passoAtual} />
      ) : (
        <div className={cn('grid', larga ? 'grid-cols-12 gap-6' : 'grid-cols-1 gap-4')}>
          {(['receita', 'despesa', 'saldo'] as const).map((metrica) => {
            const campo = metrica === 'receita' ? 'receitas' : metrica === 'despesa' ? 'despesas' : 'saldo'
            return (
              <div key={metrica} className={larga ? 'col-span-4 row-start-1' : undefined}>
                <MetricCard
                  metrica={metrica}
                  valor={resumo.data[campo]}
                  anterior={resumo.data.mes_anterior[campo]}
                  mes={mes}
                  mesAnterior={resumo.data.mes_anterior.mes}
                  papo={metrica === 'saldo' && larga ? papoSaldo : null}
                />
              </div>
            )
          })}
          <div className={larga ? 'col-[1/8] row-start-2' : undefined}>
            <SaldoLineChart
              serie={resumo.data.serie_diaria}
              ultimoDia={diasDesenhados(mes, resumo.data.serie_diaria.length)}
              mes={mes}
              progresso={progresso}
              compacto={compacto}
            />
          </div>
          <div className={larga ? 'col-[8/13] row-start-2' : undefined}>
            <UltimasTransacoes mes={mes} />
          </div>
          <div className={larga ? 'col-[1/8] row-start-3' : undefined}>
            <FluxoEspelhadoChart serie={resumo.data.serie_diaria} mes={mes} progresso={progresso} compacto={compacto} />
          </div>
          <div className={larga ? 'col-[8/13] row-[3/5]' : undefined}>
            <CategoriasTreemap
              categorias={resumo.data.por_categoria}
              despesas={resumo.data.despesas}
              mes={mes}
              progresso={progresso}
              compacto={compacto}
            />
          </div>
          <div className={larga ? 'col-[1/8] row-start-4' : undefined}>
            {anual.data ? (
              <AnoBarChart anual={anual.data} mes={mes} hoje={mesAtual()} progresso={progresso} compacto={compacto} />
            ) : anual.error ? (
              <EstadoErro erro={anual.error} onTentarNovamente={() => anual.refetch()} />
            ) : (
              <Skeleton className="h-72 rounded-cartao bg-esqueleto-1" aria-label="Carregando" />
            )}
          </div>
        </div>
      )}
    </>
  )
}
