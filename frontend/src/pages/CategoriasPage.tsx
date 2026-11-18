import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Categoria, CategoriaInput, Tipo } from '@/api/types'
import { CategoriaForm } from '@/components/CategoriaForm'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EstadoErro, EstadoVazio } from '@/components/Estados'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategorias, useExcluirCategoria, useSalvarCategoria } from '@/hooks/useCategorias'
import { mensagemDeErro } from '@/lib/erros'

const SECOES: { tipo: Tipo; titulo: string }[] = [
  { tipo: 'RECEITA', titulo: 'Receitas' },
  { tipo: 'DESPESA', titulo: 'Despesas' },
]

function rotuloTransacoes(n: number) {
  return n === 1 ? '1 transação' : `${n} transações`
}

export default function CategoriasPage() {
  const { data: categorias, isPending, error, refetch } = useCategorias()
  const salvar = useSalvarCategoria()
  const excluir = useExcluirCategoria()
  const [formAberto, setFormAberto] = useState(false)
  const [editando, setEditando] = useState<Categoria | undefined>()
  const [excluindo, setExcluindo] = useState<Categoria | null>(null)

  const abrirForm = (categoria?: Categoria) => {
    salvar.reset()
    setEditando(categoria)
    setFormAberto(true)
  }

  const enviar = (dados: CategoriaInput) => {
    salvar.mutate(
      { id: editando?.id, dados },
      {
        onSuccess: () => {
          toast.success(editando ? 'Categoria atualizada.' : 'Categoria criada.')
          setFormAberto(false)
        },
      },
    )
  }

  const abrirExclusao = (categoria: Categoria) => {
    excluir.reset()
    setExcluindo(categoria)
  }

  const confirmarExclusao = () => {
    if (!excluindo) return
    excluir.mutate(excluindo.id, {
      onSuccess: () => {
        toast.success('Categoria excluída.')
        setExcluindo(null)
      },
    })
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
          <p className="text-sm text-muted-foreground">Organize suas receitas e despesas.</p>
        </div>
        <Button onClick={() => abrirForm()}>
          <Plus aria-hidden="true" />
          Nova categoria
        </Button>
      </div>

      {isPending ? (
        <div className="grid gap-3 sm:grid-cols-2" aria-label="Carregando">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : error ? (
        <EstadoErro erro={error} onTentarNovamente={() => refetch()} />
      ) : categorias.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma categoria cadastrada"
          descricao="Crie categorias como Salário, Mercado ou Lazer para organizar suas transações."
          acao={<Button onClick={() => abrirForm()}>Criar primeira categoria</Button>}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {SECOES.map(({ tipo, titulo }) => {
            const itens = categorias.filter((c) => c.tipo === tipo)
            const idTitulo = `secao-${tipo.toLowerCase()}`
            return (
              <section key={tipo} aria-labelledby={idTitulo} className="grid content-start gap-3">
                <h2 id={idTitulo} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {titulo}
                </h2>
                {itens.length === 0 ? (
                  <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    Nenhuma categoria de {titulo.toLowerCase()}.
                  </p>
                ) : (
                  <ul className="grid gap-2">
                    {itens.map((categoria) => (
                      <li key={categoria.id}>
                        <Card className="flex items-center gap-3 px-4 py-3">
                          <span
                            className="size-4 shrink-0 rounded-full"
                            style={{ backgroundColor: categoria.cor }}
                            aria-hidden="true"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{categoria.nome}</p>
                            <p className="text-xs text-muted-foreground">{rotuloTransacoes(categoria.transacoes)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirForm(categoria)}
                            aria-label={`Editar ${categoria.nome}`}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirExclusao(categoria)}
                            aria-label={`Excluir ${categoria.nome}`}
                          >
                            <Trash2 className="text-destructive" />
                          </Button>
                        </Card>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}

      <Dialog open={formAberto} onOpenChange={setFormAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
            <DialogDescription>Defina o nome, o tipo e a cor usada nos gráficos.</DialogDescription>
          </DialogHeader>
          {formAberto && (
            <CategoriaForm
              key={editando?.id ?? 'nova'}
              categoria={editando}
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
        titulo={`Excluir "${excluindo?.nome ?? ''}"?`}
        descricao="Esta ação não pode ser desfeita. Categorias com transações não podem ser excluídas."
        onConfirmar={confirmarExclusao}
        carregando={excluir.isPending}
        erro={excluir.error ? mensagemDeErro(excluir.error) : null}
      />
    </div>
  )
}
