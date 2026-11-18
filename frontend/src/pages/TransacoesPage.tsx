// Transações (docs/design/telas/app/transacoes/Transacoes.dc.html).
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Tipo, Transacao } from '@/api/types'
import { EstadoErro } from '@/components/Estados'
import { CabecalhoPagina } from '@/components/layout/CabecalhoPagina'
import { useInterface, useOcultarPapoDoMenu } from '@/components/layout/contexto'
import { Espiando, Personagem } from '@/components/Personagem'
import { ValorSaldo, ValorTransacao } from '@/components/ValorTransacao'
import { botao, botaoIcone } from '@/components/ui/botao'
import { useCategorias } from '@/hooks/useCategorias'
import { useDebounce } from '@/hooks/useDebounce'
import { useMesSelecionado } from '@/hooks/useMesSelecionado'
import { useTelaLarga } from '@/hooks/useTelaLarga'
import { useTransacoes } from '@/hooks/useTransacoes'
import { formatarComSinal, formatarData, nomeDoMes } from '@/lib/format'
import { cn } from '@/lib/utils'

const POR_PAGINA = 20
const TIPOS: { valor: Tipo | ''; rotulo: string }[] = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'RECEITA', rotulo: 'Receitas' },
  { valor: 'DESPESA', rotulo: 'Despesas' },
]
const DIAS_DA_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const COLUNAS = 'grid-cols-[112px_minmax(0,1.6fr)_minmax(0,1fr)_160px_96px]'

function rotuloDoDia(iso: string) {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return `${formatarData(iso)} · ${DIAS_DA_SEMANA[new Date(ano, mes - 1, dia).getDay()]}`
}

function descricaoAcessivel(t: Transacao) {
  return `${t.descricao}, ${formatarComSinal(t.valor, t.tipo)}, ${formatarData(t.data)}`
}

/** Páginas visíveis: todas até 7; depois, a atual e as vizinhas. */
function paginasVisiveis(atual: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const inicio = Math.max(1, Math.min(atual - 2, total - 4))
  return Array.from({ length: 5 }, (_, i) => inicio + i)
}

export default function TransacoesPage() {
  const larga = useTelaLarga()
  const { mes } = useMesSelecionado()
  const { abrirTransacao, pedirExclusao, avisoAberto } = useInterface()
  const [params, setParams] = useSearchParams()
  const tipoUrl = params.get('tipo')
  const tipo: Tipo | '' = tipoUrl === 'RECEITA' || tipoUrl === 'DESPESA' ? tipoUrl : ''
  const categoria = params.get('categoria') ?? ''
  const pagina = Math.max(1, Number(params.get('page')) || 1)
  const [busca, setBusca] = useState('')
  const buscaAtrasada = useDebounce(busca.trim())

  const atualizarFiltros = (mudancas: Record<string, string>) =>
    setParams((atual) => {
      const proximos = new URLSearchParams(atual)
      Object.entries(mudancas).forEach(([chave, valor]) => (valor ? proximos.set(chave, valor) : proximos.delete(chave)))
      if (!('page' in mudancas)) proximos.delete('page')
      return proximos
    })

  const { data, isPending, isFetching, error, refetch } = useTransacoes({
    mes,
    tipo: tipo || undefined,
    categoria: categoria ? Number(categoria) : undefined,
    busca: buscaAtrasada || undefined,
    page: pagina,
  })
  const categorias = useCategorias()

  // Busca nova volta para a página 1.
  useEffect(() => {
    if (buscaAtrasada) atualizarFiltros({})
  }, [buscaAtrasada]) // eslint-disable-line react-hooks/exhaustive-deps
  // Excluir o último item de uma página volta uma página.
  useEffect(() => {
    if (data && data.results.length === 0 && data.count > 0 && pagina > 1) atualizarFiltros({ page: String(pagina - 1) })
  }, [data, pagina]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtroAtivo = tipo !== '' || categoria !== '' || busca.trim() !== ''
  const limpar = () => {
    setBusca('')
    atualizarFiltros({ tipo: '', categoria: '' })
  }
  const vazio = !isPending && !error && data?.count === 0
  useOcultarPapoDoMenu(vazio)
  const totalPaginas = data ? Math.max(1, Math.ceil(data.count / POR_PAGINA)) : 1
  const semCategorias = categorias.data?.length === 0
  const receitas = categorias.data?.filter((c) => c.tipo === 'RECEITA') ?? []
  const despesas = categorias.data?.filter((c) => c.tipo === 'DESPESA') ?? []

  return (
    <>
      <CabecalhoPagina titulo="Transações" />

      <Espiando pose={larga && !vazio && !avisoAberto ? 'papo-espiando' : null} altura={80} direita={28} className="mb-5">
        <section aria-label="Filtros" className={cn('flex flex-col gap-3.5 rounded-cartao bg-branco shadow-cartao', larga ? 'px-[22px] py-5' : 'p-4')}>
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3.5">
            <div className={cn('flex flex-col gap-1.5', larga ? 'flex-none' : 'basis-full')}>
              <span id="lbl-tipo" className="text-sm font-semibold">
                Tipo
              </span>
              <div role="group" aria-labelledby="lbl-tipo" className="grid grid-cols-3 gap-0.5 rounded-campo bg-segmentado-bg p-0.5">
                {TIPOS.map(({ valor, rotulo }) => {
                  const ativo = tipo === valor
                  return (
                    <button
                      key={rotulo}
                      type="button"
                      aria-pressed={ativo}
                      onClick={() => atualizarFiltros({ tipo: valor })}
                      className={cn(
                        'min-h-11 cursor-pointer rounded-[10px] border-0 px-3.5 text-sm whitespace-nowrap',
                        ativo ? 'bg-branco font-bold text-tinta shadow-[0_1px_3px_rgba(20,32,40,0.15)]' : 'bg-transparent font-semibold text-texto-3',
                      )}
                    >
                      {rotulo}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className={cn('flex min-w-0 flex-col gap-1.5', larga ? 'flex-[0_1_240px]' : 'basis-full')}>
              <label htmlFor="f-cat" className="text-sm font-semibold">
                Categoria
              </label>
              <select
                id="f-cat"
                value={categoria}
                onChange={(e) => atualizarFiltros({ categoria: e.target.value })}
                className="h-12 cursor-pointer rounded-campo border-[1.5px] border-borda-campo bg-branco px-3 text-[15px] font-medium text-tinta"
              >
                <option value="">Todas as categorias</option>
                {receitas.length > 0 && (
                  <optgroup label="Receitas">
                    {receitas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </optgroup>
                )}
                {despesas.length > 0 && (
                  <optgroup label="Despesas">
                    {despesas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1.5">
              <label htmlFor="f-busca" className="text-sm font-semibold">
                Buscar
              </label>
              <div className="flex h-12 items-center gap-2 rounded-campo border-[1.5px] border-borda-campo bg-branco px-3 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-tinta">
                <Search className="size-[18px] shrink-0 text-texto-2" aria-hidden="true" />
                <input
                  id="f-busca"
                  type="search"
                  placeholder="Buscar por descrição"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent text-base font-medium outline-none"
                />
              </div>
            </div>
            {filtroAtivo && (
              <button type="button" onClick={limpar} className={botao({ tipo: 'secundario' })}>
                Limpar filtros
              </button>
            )}
          </div>
          {data && (
            <p data-testid="resumo-filtro" className="m-0 text-[13px] font-medium text-texto-2">
              {data.count} {data.count === 1 ? 'transação' : 'transações'} · Receitas {formatarComSinal(data.totais.receitas, 'RECEITA')} ·
              Despesas {formatarComSinal(data.totais.despesas, 'DESPESA')}
            </p>
          )}
        </section>
      </Espiando>

      {semCategorias && (
        <p className="mb-5 rounded-campo bg-branco px-4 py-3 text-sm font-medium shadow-cartao">Cadastre uma categoria antes de registrar transações.</p>
      )}

      {isPending ? (
        <section aria-busy="true" aria-label="Lista de transações" className="overflow-hidden rounded-cartao bg-branco px-4 py-1.5 shadow-cartao">
          <span role="status" className="sr-only">
            Carregando transações…
          </span>
          <div aria-hidden="true" className="flex flex-col">
            {['46%', '38%', '52%', '34%', '44%', '40%', '48%', '36%'].map((largura, i) => (
              <div key={largura} className={cn('flex items-center gap-5 px-2 py-[18px]', i > 0 && 'border-t border-esqueleto-2')}>
                {larga && <span className="h-3 w-20 rounded-md bg-esqueleto-1" />}
                <span className="flex flex-1 flex-col gap-2">
                  <span className="h-3 rounded-md bg-esqueleto-1" style={{ width: largura }} />
                  <span className="h-2.5 w-[30%] rounded-[5px] bg-esqueleto-2" />
                </span>
                <span className="h-3 w-24 rounded-md bg-esqueleto-1" />
              </div>
            ))}
          </div>
        </section>
      ) : error ? (
        <EstadoErro erro={error} onTentarNovamente={() => refetch()} />
      ) : vazio ? (
        <section
          aria-labelledby="vazio-t"
          className={cn(
            'relative flex flex-col items-center gap-3.5 overflow-hidden rounded-cartao bg-branco text-center shadow-cartao',
            larga ? 'min-h-[380px] justify-center px-[220px] py-10' : 'min-h-[420px] justify-end px-5 pt-6 pb-7',
          )}
        >
          <Personagem pose="papo-espiando-lado" altura={larga ? 240 : 150} className={cn('absolute left-0', larga ? 'bottom-0' : 'top-6')} />
          <Personagem pose="gaivota" altura={larga ? 150 : 110} className={cn('absolute bottom-0', larga ? 'right-10' : 'right-4')} />
          <h2 id="vazio-t" className="relative m-0 max-w-[360px] text-xl leading-[1.35] font-extrabold">
            {filtroAtivo ? 'Nenhuma transação encontrada com esses filtros.' : `Nenhuma transação em ${nomeDoMes(mes)}.`}
          </h2>
          <p className="relative m-0 max-w-[360px] text-[15px] leading-normal font-medium text-texto-2">
            {filtroAtivo ? 'Tente outra palavra na busca ou volte a mostrar todas.' : 'Registre a primeira receita ou despesa do mês.'}
          </p>
          {filtroAtivo ? (
            <button type="button" onClick={limpar} className={cn(botao({ tipo: 'primario' }), 'relative')}>
              Limpar filtros
            </button>
          ) : (
            !semCategorias && (
              <button type="button" onClick={() => abrirTransacao()} className={cn(botao({ tipo: 'primario' }), 'relative')}>
                <Plus strokeWidth={2.5} aria-hidden="true" />
                Nova transação
              </button>
            )
          )}
        </section>
      ) : larga ? (
        <section aria-label="Lista de transações" className={cn('overflow-hidden rounded-cartao bg-branco px-2 pt-2 shadow-cartao', isFetching && 'opacity-70')}>
          <div role="table" aria-label={`Transações de ${nomeDoMes(mes)}, página ${pagina} de ${totalPaginas}`} className="flex flex-col">
            <div role="rowgroup">
              <div role="row" className={cn('grid items-center gap-4 px-4 py-3 text-xs font-bold tracking-[0.4px] text-texto-2 uppercase', COLUNAS)}>
                <span role="columnheader">Data</span>
                <span role="columnheader">Descrição</span>
                <span role="columnheader">Categoria</span>
                <span role="columnheader" className="text-right">
                  Valor
                </span>
                <span role="columnheader" className="text-right">
                  <span className="sr-only">Ações</span>
                </span>
              </div>
            </div>
            <div role="rowgroup">
              {data.results.map((t) => (
                <div key={t.id} role="row" className={cn('grid min-h-14 items-center gap-4 border-t border-divisor px-4 py-1', COLUNAS)}>
                  <span role="cell" className="text-sm font-semibold text-texto-3">
                    {formatarData(t.data)}
                  </span>
                  <span role="cell" className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[15px] font-bold">{t.descricao}</span>
                    {t.observacao && <span className="truncate text-xs font-medium text-texto-2">{t.observacao}</span>}
                  </span>
                  <span role="cell" className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                    <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: t.categoria_cor }} />
                    <span className="truncate">{t.categoria_nome}</span>
                  </span>
                  <span role="cell" className="flex justify-end">
                    <ValorTransacao valor={t.valor} tipo={t.tipo} className="gap-[5px] text-[15px]" />
                  </span>
                  <span role="cell" className="flex justify-end gap-0.5">
                    <button type="button" className={botaoIcone} onClick={() => abrirTransacao(t)} aria-label={`Editar ${descricaoAcessivel(t)}`}>
                      <Pencil aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={cn(botaoIcone, 'text-despesa')}
                      onClick={() => pedirExclusao(t)}
                      aria-label={`Excluir ${t.descricao}, ${formatarData(t.data)}`}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section aria-label="Lista de transações" className={cn('flex flex-col gap-[18px]', isFetching && 'opacity-70')}>
          {data.totais_por_dia.map(({ data: dia, saldo }) => (
            <div key={dia} className="flex flex-col gap-2">
              <h2 className="m-0 flex justify-between gap-2 text-[13px] font-bold text-texto-2">
                <span>{rotuloDoDia(dia)}</span>
                <ValorSaldo valor={saldo} className="text-[13px]" />
              </h2>
              <ul className="m-0 list-none overflow-hidden rounded-cartao bg-branco p-0 shadow-cartao">
                {data.results
                  .filter((t) => t.data === dia)
                  .map((t, i) => (
                    <li key={t.id} className={cn(i > 0 && 'border-t border-divisor')}>
                      <button
                        type="button"
                        onClick={() => abrirTransacao(t)}
                        aria-label={`Editar ${descricaoAcessivel(t)}`}
                        className="flex min-h-16 w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-3.5 py-2.5 text-left text-tinta"
                      >
                        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: t.categoria_cor }} />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate text-[15px] font-bold">{t.descricao}</span>
                          <span className="text-xs font-medium text-texto-2">{t.categoria_nome}</span>
                        </span>
                        <ValorTransacao valor={t.valor} tipo={t.tipo} className="text-[15px]" />
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {data && !vazio && !error && (
        <nav aria-label="Paginação" className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] font-semibold text-texto-2">
            Mostrando {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, data.count)} de {data.count}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={cn(botaoIcone, 'border border-borda-sutil bg-branco')}
              onClick={() => atualizarFiltros({ page: String(pagina - 1) })}
              disabled={pagina <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft strokeWidth={2.5} aria-hidden="true" />
            </button>
            {paginasVisiveis(pagina, totalPaginas).map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`Página ${n}`}
                aria-current={n === pagina ? 'page' : undefined}
                onClick={() => atualizarFiltros({ page: String(n) })}
                className={cn(
                  'h-11 min-w-11 cursor-pointer rounded-[10px] border text-sm font-bold',
                  n === pagina ? 'border-tinta bg-tinta text-branco' : 'border-borda-sutil bg-branco text-tinta',
                )}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className={cn(botaoIcone, 'border border-borda-sutil bg-branco')}
              onClick={() => atualizarFiltros({ page: String(pagina + 1) })}
              disabled={pagina >= totalPaginas}
              aria-label="Próxima página"
            >
              <ChevronRight strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </>
  )
}
