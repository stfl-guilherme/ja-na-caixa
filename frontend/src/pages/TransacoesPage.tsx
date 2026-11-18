import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Tipo, Transacao, TransacaoInput } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EstadoErro, EstadoVazio } from '@/components/Estados'
import { SeletorMes } from '@/components/SeletorMes'
import { TransacaoForm } from '@/components/TransacaoForm'
import { ValorTransacao } from '@/components/ValorTransacao'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCategorias } from '@/hooks/useCategorias'
import { useDebounce } from '@/hooks/useDebounce'
import { useExcluirTransacao, useSalvarTransacao, useTransacoes } from '@/hooks/useTransacoes'
import { mensagemDeErro } from '@/lib/erros'
import { formatarData, mesAtual } from '@/lib/format'

const POR_PAGINA = 20

export default function TransacoesPage() {
  const [mes, setMes] = useState(mesAtual())
  const [categoria, setCategoria] = useState('')
  const [tipo, setTipo] = useState<Tipo | ''>('')
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const buscaAtrasada = useDebounce(busca.trim())

  const filtros = {
    mes,
    categoria: categoria ? Number(categoria) : undefined,
    tipo: tipo || undefined,
    busca: buscaAtrasada || undefined,
    page: pagina,
  }
  const { data, isPending, isFetching, error, refetch } = useTransacoes(filtros)
  const categorias = useCategorias()
  const salvar = useSalvarTransacao()
  const excluir = useExcluirTransacao()

  const [formAberto, setFormAberto] = useState(false)
  const [editando, setEditando] = useState<Transacao | undefined>()
  const [excluindo, setExcluindo] = useState<Transacao | null>(null)

  const mudarFiltro = <T,>(setter: (v: T) => void) => (valor: T) => {
    setter(valor)
    setPagina(1)
  }

  const totalPaginas = data ? Math.max(1, Math.ceil(data.count / POR_PAGINA)) : 1

  const abrirForm = (transacao?: Transacao) => {
    salvar.reset()
    setEditando(transacao)
    setFormAberto(true)
  }

  const enviar = (dados: TransacaoInput) => {
    salvar.mutate(
      { id: editando?.id, dados },
      {
        onSuccess: () => {
          toast.success(editando ? 'Transação atualizada.' : 'Transação criada.')
          setFormAberto(false)
        },
      },
    )
  }

  const confirmarExclusao = () => {
    if (!excluindo) return
    excluir.mutate(excluindo.id, {
      onSuccess: () => {
        toast.success('Transação excluída.')
        setExcluindo(null)
        // Era o último item da página: volta uma página para não mostrar lista vazia.
        if (data?.results.length === 1 && pagina > 1) setPagina((p) => p - 1)
      },
    })
  }

  const semCategorias = categorias.data?.length === 0

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
          <p className="text-sm text-muted-foreground">Receitas e despesas do período.</p>
        </div>
        <Button onClick={() => abrirForm()} disabled={semCategorias}>
          <Plus aria-hidden="true" />
          Nova transação
        </Button>
      </div>

      <Card className="grid gap-3 p-4 md:grid-cols-[auto_1fr_1fr_1.5fr] md:items-end">
        <div className="grid gap-1.5">
          <span className="text-sm font-medium">Mês</span>
          <SeletorMes mes={mes} onChange={mudarFiltro(setMes)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="filtro-categoria">Categoria</Label>
          <NativeSelect
            id="filtro-categoria"
            value={categoria}
            onChange={(e) => mudarFiltro(setCategoria)(e.target.value)}
          >
            <option value="">Todas</option>
            {categorias.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="filtro-tipo">Tipo</Label>
          <NativeSelect
            id="filtro-tipo"
            value={tipo}
            onChange={(e) => mudarFiltro(setTipo)(e.target.value as Tipo | '')}
          >
            <option value="">Todos</option>
            <option value="RECEITA">Receitas</option>
            <option value="DESPESA">Despesas</option>
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="filtro-busca">Buscar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="filtro-busca"
              className="pl-9"
              placeholder="Descrição…"
              value={busca}
              onChange={(e) => mudarFiltro(setBusca)(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {semCategorias && (
        <p className="rounded-md bg-secondary px-4 py-3 text-sm">
          Cadastre uma categoria antes de registrar transações.
        </p>
      )}

      {isPending ? (
        <div className="grid gap-2" aria-label="Carregando">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : error ? (
        <EstadoErro erro={error} onTentarNovamente={() => refetch()} />
      ) : data.results.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma transação encontrada"
          descricao="Ajuste os filtros ou registre uma nova transação."
          acao={
            !semCategorias && (
              <Button variant="outline" onClick={() => abrirForm()}>
                Registrar transação
              </Button>
            )
          }
        />
      ) : (
        <Card className={isFetching ? 'opacity-70 transition-opacity' : undefined}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-24 text-right">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.results.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatarData(t.data)}</TableCell>
                  <TableCell className="max-w-56">
                    <p className="truncate font-medium">{t.descricao}</p>
                    {t.observacao && <p className="truncate text-xs text-muted-foreground">{t.observacao}</p>}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: t.categoria_cor }} aria-hidden="true" />
                      {t.categoria_nome}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <ValorTransacao valor={t.valor} tipo={t.tipo} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <Button variant="ghost" size="icon" onClick={() => abrirForm(t)} aria-label={`Editar ${t.descricao}`}>
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        excluir.reset()
                        setExcluindo(t)
                      }}
                      aria-label={`Excluir ${t.descricao}`}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {data.count} {data.count === 1 ? 'transação' : 'transações'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPagina((p) => p - 1)}
                disabled={pagina <= 1}
                aria-label="Página anterior"
              >
                <ChevronLeft />
              </Button>
              <span>
                Página {pagina} de {totalPaginas}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPagina((p) => p + 1)}
                disabled={pagina >= totalPaginas}
                aria-label="Próxima página"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={formAberto} onOpenChange={setFormAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar transação' : 'Nova transação'}</DialogTitle>
            <DialogDescription>O tipo (receita ou despesa) vem da categoria escolhida.</DialogDescription>
          </DialogHeader>
          {formAberto && (
            <TransacaoForm
              key={editando?.id ?? 'nova'}
              transacao={editando}
              categorias={categorias.data ?? []}
              onSalvar={enviar}
              onCancelar={() => setFormAberto(false)}
              salvando={salvar.isPending}
              erro={salvar.error}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={excluindo !== null}
        onAbertoChange={(aberto) => !aberto && setExcluindo(null)}
        titulo={`Excluir "${excluindo?.descricao ?? ''}"?`}
        descricao="Esta ação não pode ser desfeita."
        onConfirmar={confirmarExclusao}
        carregando={excluir.isPending}
        erro={excluir.error ? mensagemDeErro(excluir.error) : null}
      />
    </div>
  )
}
