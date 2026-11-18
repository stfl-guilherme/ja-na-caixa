// Exclusão de categoria (docs/design/telas/app/categorias/Categorias_Excluir.dc.html).
// Com transações, o diálogo é só informativo: não há botão de excluir.
// A página usa `key` por categoria, então o estado da exclusão recomeça a cada abertura.
import { Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/api/client'
import type { Categoria } from '@/api/types'
import { Personagem } from '@/components/Personagem'
import { botao } from '@/components/ui/botao'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useExcluirCategoria } from '@/hooks/useCategorias'
import { useMesSelecionado } from '@/hooks/useMesSelecionado'
import { mensagemDeErro } from '@/lib/erros'

interface Props {
  categoria: Categoria | null
  onFechar: () => void
  onExcluida: () => void
}

function quantidadeDo409(erro: unknown): number | null {
  if (!(erro instanceof ApiError) || erro.status !== 409) return null
  const corpo = erro.body as { transacoes?: number } | null
  return typeof corpo?.transacoes === 'number' ? corpo.transacoes : null
}

export function ExcluirCategoriaDialog({ categoria, onFechar, onExcluida }: Props) {
  const excluir = useExcluirCategoria()
  const { comMes } = useMesSelecionado()

  const quantidade = quantidadeDo409(excluir.error) ?? categoria?.transacoes ?? 0
  const bloqueada = quantidade > 0
  const palavra = quantidade === 1 ? 'transação' : 'transações'

  return (
    <Dialog open={categoria !== null} onOpenChange={(abrir) => !abrir && onFechar()}>
      <DialogContent role="alertdialog" centralizado semFechar className="max-w-[440px] items-center gap-3 p-6 text-center">
        {categoria && bloqueada ? (
          <>
            <Personagem pose="papo-preocupado" altura={150} />
            <DialogTitle>Não dá para excluir “{categoria.nome}” ainda</DialogTitle>
            <DialogDescription className="text-[15px] leading-normal text-texto-3">
              Esta categoria tem {quantidade} {palavra}. Mova ou exclua as transações antes.
            </DialogDescription>
            <div className="mt-1.5 flex flex-wrap justify-center gap-2.5">
              <Link to={comMes('/transacoes', { categoria: String(categoria.id) })} className={botao({ tipo: 'secundario' })}>
                Ver transações
              </Link>
              <DialogClose className={botao({ tipo: 'primario' })} autoFocus>
                Entendi
              </DialogClose>
            </div>
          </>
        ) : categoria ? (
          <>
            <DialogTitle>Excluir “{categoria.nome}”?</DialogTitle>
            <DialogDescription className="text-[15px] leading-normal text-texto-3">
              A categoria não tem transações. Isso não pode ser desfeito.
            </DialogDescription>
            {excluir.error ? (
              <p role="alert" className="m-0 rounded-campo bg-erro-bg px-3.5 py-3 text-sm font-semibold text-erro-tx">
                {mensagemDeErro(excluir.error)}
              </p>
            ) : null}
            <div className="mt-1.5 flex flex-wrap justify-center gap-2.5">
              <DialogClose className={botao({ tipo: 'secundario' })} autoFocus>
                Cancelar
              </DialogClose>
              <button
                type="button"
                className={botao({ tipo: 'perigo' })}
                disabled={excluir.isPending}
                onClick={() => excluir.mutate(categoria.id, { onSuccess: onExcluida })}
              >
                <Trash2 aria-hidden="true" />
                <span>Excluir categoria</span>
              </button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
