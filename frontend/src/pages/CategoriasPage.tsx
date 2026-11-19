// Categorias (docs/design/telas/app/categorias/Categorias.dc.html).
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, Tag, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Categoria, Tipo } from '@/api/types'
import { BarraOrcamento } from '@/components/BarraOrcamento'
import { CategoriaModal } from '@/components/CategoriaModal'
import { EstadoErro, EstadoVazio } from '@/components/Estados'
import { ExcluirCategoriaDialog } from '@/components/ExcluirCategoriaDialog'
import { CabecalhoPagina } from '@/components/layout/CabecalhoPagina'
import { useInterface } from '@/components/layout/contexto'
import { Personagem } from '@/components/Personagem'
import { botao, botaoIcone } from '@/components/ui/botao'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategorias } from '@/hooks/useCategorias'
import { useMesSelecionado } from '@/hooks/useMesSelecionado'
import { useOrcamentos } from '@/hooks/useOrcamentos'
import { useResumo } from '@/hooks/useResumo'
import { useTelaLarga } from '@/hooks/useTelaLarga'
import { formatarComSinal, formatarMoeda, nomeDoMes } from '@/lib/format'
import { nomeDaCor } from '@/lib/paleta'
import { cn } from '@/lib/utils'

const SECOES: { tipo: Tipo; titulo: string; id: string }[] = [
  { tipo: 'RECEITA', titulo: 'Receitas', id: 's-receitas' },
  { tipo: 'DESPESA', titulo: 'Despesas', id: 's-despesas' },
]

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

export default function CategoriasPage() {
  const larga = useTelaLarga()
  const { mes } = useMesSelecionado()
  const { avisar, avisoAberto } = useInterface()
  const { data: categorias, isPending, error, refetch } = useCategorias()
  const resumo = useResumo(mes)
  const orcamentos = useOrcamentos(mes)
  const [modal, setModal] = useState<{ aberto: boolean; categoria?: Categoria }>({ aberto: false })
  const [excluindo, setExcluindo] = useState<Categoria | null>(null)
  const nomeMes = nomeDoMes(mes)

  /** Quantidade e total do mês vêm do resumo calculado no backend (spec 6.4). */
  const doMes = (id: number) => resumo.data?.por_categoria.find((c) => c.categoria_id === id)

  const novaCategoria = (
    <button type="button" onClick={() => setModal({ aberto: true })} className={botao({ tipo: 'secundario' })}>
      <Plus strokeWidth={2.5} aria-hidden="true" />
      <span>Nova categoria</span>
    </button>
  )

  return (
    <>
      <CabecalhoPagina titulo="Categorias" acao={novaCategoria} />

      {isPending ? (
        <div className="grid gap-4 largo:grid-cols-3" aria-label="Carregando">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-cartao bg-esqueleto-1" />
          ))}
        </div>
      ) : error ? (
        <EstadoErro erro={error} onTentarNovamente={() => refetch()} />
      ) : categorias.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma categoria cadastrada"
          descricao="Crie categorias como Salário, Mercado ou Lazer para organizar suas transações."
          acao={
            <button type="button" onClick={() => setModal({ aberto: true })} className={botao({ tipo: 'primario' })}>
              Criar primeira categoria
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          {SECOES.map(({ tipo, titulo, id }) => {
            const itens = categorias.filter((c) => c.tipo === tipo)
            const totalSecao = tipo === 'RECEITA' ? resumo.data?.receitas : resumo.data?.despesas
            const comPapo = tipo === 'RECEITA' && larga && !excluindo && !avisoAberto
            return (
              <section key={tipo} aria-labelledby={id} className="flex flex-col gap-3.5">
                <div className={cn('flex items-end gap-3', tipo === 'RECEITA' && larga && 'min-h-[72px]')}>
                  <h2 id={id} className="m-0 text-xl leading-tight font-extrabold">
                    {titulo} <span className="text-sm font-semibold text-texto-2">· {plural(itens.length, 'categoria', 'categorias')}</span>
                  </h2>
                  {comPapo && <Personagem pose="papo-sentado-moeda" altura={72} className="-mb-0.5" />}
                  <span className="flex-1" />
                  {totalSecao !== undefined && (
                    <span data-testid="total-secao" className={cn('text-sm font-bold whitespace-nowrap', tipo === 'RECEITA' ? 'text-receita' : 'text-despesa')}>
                      {formatarComSinal(totalSecao, tipo)} em {nomeMes}
                    </span>
                  )}
                </div>
                {itens.length === 0 ? (
                  <p className="m-0 rounded-cartao border border-dashed border-borda-botao px-4 py-6 text-center text-sm font-medium text-texto-2">
                    Nenhuma categoria de {titulo.toLowerCase()}.
                  </p>
                ) : (
                  <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 largo:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
                    {itens.map((c) => {
                      const mesCat = doMes(c.id)
                      const orcamento = orcamentos.data?.find((o) => o.categoria_id === c.id)
                      const quantidade = mesCat?.quantidade ?? 0
                      const Seta = c.tipo === 'RECEITA' ? ArrowDownLeft : ArrowUpRight
                      return (
                        <li key={c.id} className="flex min-w-0 flex-col gap-3.5 rounded-cartao bg-branco py-4 pr-3.5 pl-[18px] shadow-cartao">
                          <div className="flex items-center gap-3">
                            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full" style={{ background: c.cor }}>
                              <Tag className="size-5 text-branco" strokeWidth={2.2} />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <strong className="truncate text-base font-bold">{c.nome}</strong>
                              <span className="text-xs font-semibold text-texto-2">
                                {c.tipo === 'RECEITA' ? 'Receita' : 'Despesa'} · cor {nomeDaCor(c.cor).toLowerCase()}
                              </span>
                            </span>
                            <button type="button" className={botaoIcone} onClick={() => setModal({ aberto: true, categoria: c })} aria-label={`Editar categoria ${c.nome}`}>
                              <Pencil aria-hidden="true" />
                            </button>
                            <button type="button" className={cn(botaoIcone, 'text-despesa')} onClick={() => setExcluindo(c)} aria-label={`Excluir categoria ${c.nome}`}>
                              <Trash2 aria-hidden="true" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between gap-2 border-t border-divisor pt-3">
                            <span className="text-[13px] font-semibold text-texto-2">{plural(quantidade, 'transação', 'transações')} em {nomeMes}</span>
                            {mesCat ? (
                              <span className={cn('flex items-center gap-1 text-[15px] font-extrabold whitespace-nowrap', c.tipo === 'RECEITA' ? 'text-receita' : 'text-despesa')}>
                                <Seta className="size-3.5" strokeWidth={2.6} aria-hidden="true" />
                                <span>{formatarComSinal(mesCat.total, c.tipo)}</span>
                              </span>
                            ) : (
                              <span className="text-[15px] font-extrabold text-texto-2">{formatarMoeda('0')}</span>
                            )}
                          </div>
                          {orcamento && <BarraOrcamento orcamento={orcamento} />}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}

      <CategoriaModal
        aberto={modal.aberto}
        categoria={modal.categoria}
        onFechar={() => setModal({ aberto: false })}
        onSalva={() => {
          setModal({ aberto: false })
          avisar('Categoria salva.')
        }}
      />
      <ExcluirCategoriaDialog
        key={excluindo?.id ?? 'nenhuma'}
        categoria={excluindo}
        onFechar={() => setExcluindo(null)}
        onExcluida={() => {
          setExcluindo(null)
          avisar('Categoria excluída.')
        }}
      />
    </>
  )
}
