// Confirmação de exclusão (docs/design/telas/app/transacoes/Transacoes_Excluir.dc.html).
import { Trash2 } from 'lucide-react'
import type { Transacao } from '@/api/types'
import { ValorTransacao } from '@/components/ValorTransacao'
import { botao } from '@/components/ui/botao'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useExcluirTransacao } from '@/hooks/useTransacoes'
import { mensagemDeErro } from '@/lib/erros'
import { formatarData, nomeDoMes } from '@/lib/format'

interface Props {
  transacao: Transacao | null
  onFechar: () => void
  onExcluida: () => void
}

export function ExcluirTransacaoDialog({ transacao, onFechar, onExcluida }: Props) {
  const excluir = useExcluirTransacao()
  const fechar = () => {
    excluir.reset()
    onFechar()
  }

  return (
    <Dialog open={transacao !== null} onOpenChange={(abrir) => !abrir && fechar()}>
      <DialogContent role="alertdialog" centralizado semFechar className="max-w-[440px] gap-3.5 p-6">
        <DialogTitle>Excluir transação?</DialogTitle>
        {transacao && (
          <DialogDescription asChild>
            <div className="flex flex-col gap-2.5 text-[15px] text-texto-3">
              <span className="flex items-center gap-3 rounded-campo bg-fundo-app px-3.5 py-3">
                <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: transacao.categoria_cor }} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <strong className="text-[15px] font-bold text-tinta">{transacao.descricao}</strong>
                  <span className="text-[13px] font-medium text-texto-2">
                    {transacao.categoria_nome} · {formatarData(transacao.data)}
                  </span>
                </span>
                <ValorTransacao valor={transacao.valor} tipo={transacao.tipo} className="text-[15px]" />
              </span>
              <span className="leading-normal font-medium">
                Ela sai do saldo e dos gráficos de {nomeDoMes(transacao.data.slice(0, 7))}. Isso não pode ser desfeito.
              </span>
            </div>
          </DialogDescription>
        )}
        {excluir.error ? (
          <p role="alert" className="m-0 rounded-campo bg-erro-bg px-3.5 py-3 text-sm font-semibold text-erro-tx">
            {mensagemDeErro(excluir.error)}
          </p>
        ) : null}
        <div className="mt-1 flex flex-wrap justify-end gap-2.5">
          <DialogClose className={botao({ tipo: 'secundario' })} autoFocus>
            Cancelar
          </DialogClose>
          <button
            type="button"
            className={botao({ tipo: 'perigo' })}
            disabled={excluir.isPending}
            onClick={() =>
              transacao &&
              excluir.mutate(transacao.id, {
                onSuccess: () => {
                  excluir.reset()
                  onExcluida()
                },
              })
            }
          >
            <Trash2 aria-hidden="true" />
            <span>Excluir transação</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
