// Repetir transações fixas do mês anterior (spec 17.4; ADR-024).
import { Repeat } from 'lucide-react'
import { useState } from 'react'
import { EstadoErro } from '@/components/Estados'
import { ValorTransacao } from '@/components/ValorTransacao'
import { botao } from '@/components/ui/botao'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useFixasParaRepetir, useRepetirFixas } from '@/hooks/useTransacoes'
import { mensagemDeErro } from '@/lib/erros'
import { deslocarMes, formatarData, nomeDoMes } from '@/lib/format'

interface Props {
  aberto: boolean
  /** Mês de destino ("AAAA-MM"); as fixas vêm do mês anterior a ele. */
  mes: string
  onFechar: () => void
  /** Recebe quantas transações foram criadas. */
  onLancadas: (quantidade: number) => void
}

const plural = (n: number) => (n === 1 ? '1 transação' : `${n} transações`)

export function RepetirFixasDialog({ aberto, mes, onFechar, onLancadas }: Props) {
  const nomeAnterior = nomeDoMes(deslocarMes(mes, -1))
  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && onFechar()}>
      <DialogContent aria-describedby="rf-ajuda" className="max-w-[560px]">
        <DialogHeader className="mb-[18px]">
          <DialogTitle>Repetir fixas de {nomeAnterior}</DialogTitle>
          <DialogDescription id="rf-ajuda">
            Escolha quais lançar em {nomeDoMes(mes)}. Elas entram com o mesmo valor, no mesmo dia do mês.
          </DialogDescription>
        </DialogHeader>
        {aberto && <Lista key={mes} mes={mes} nomeAnterior={nomeAnterior} onFechar={onFechar} onLancadas={onLancadas} />}
      </DialogContent>
    </Dialog>
  )
}

function Lista({ mes, nomeAnterior, onFechar, onLancadas }: Omit<Props, 'aberto'> & { nomeAnterior: string }) {
  const fixas = useFixasParaRepetir(mes, true)
  const repetir = useRepetirFixas()
  // Todas começam marcadas: guardamos só as desmarcadas.
  const [desmarcadas, setDesmarcadas] = useState<Set<number>>(new Set())

  if (fixas.isPending) {
    return (
      <div className="grid gap-2" aria-label="Carregando">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-14 bg-esqueleto-1" />
        ))}
      </div>
    )
  }
  if (fixas.error) return <EstadoErro erro={fixas.error} onTentarNovamente={() => fixas.refetch()} />

  if (fixas.data.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="m-0 rounded-campo bg-fundo-app px-4 py-5 text-center text-[15px] font-semibold text-texto-3">
          Nenhuma transação fixa de {nomeAnterior} para repetir.
        </p>
        <div className="flex justify-end">
          <button type="button" onClick={onFechar} className={botao({ tipo: 'secundario' })}>
            Fechar
          </button>
        </div>
      </div>
    )
  }

  const marcadas = fixas.data.filter((t) => !desmarcadas.has(t.id))
  const alternar = (id: number) =>
    setDesmarcadas((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })

  return (
    <div className="flex flex-col gap-4">
      <ul className="m-0 flex max-h-[50vh] list-none flex-col overflow-y-auto rounded-campo border border-borda-sutil p-0">
        {fixas.data.map((t, i) => (
          <li key={t.id} className={i > 0 ? 'border-t border-divisor' : undefined}>
            <label className="flex min-h-16 cursor-pointer items-center gap-3 px-3.5 py-2.5">
              <input
                type="checkbox"
                checked={!desmarcadas.has(t.id)}
                onChange={() => alternar(t.id)}
                aria-label={`${t.descricao}, ${t.categoria_nome}, em ${formatarData(t.data_sugerida)}`}
                className="m-0 size-5 shrink-0 accent-verde-700"
              />
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: t.categoria_cor }} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[15px] font-bold">{t.descricao}</span>
                <span className="text-xs font-medium text-texto-2">
                  {t.categoria_nome} · em {formatarData(t.data_sugerida)}
                </span>
              </span>
              <ValorTransacao valor={t.valor} tipo={t.tipo} className="text-[15px]" />
            </label>
          </li>
        ))}
      </ul>
      {repetir.error ? (
        <p role="alert" className="m-0 rounded-campo bg-erro-bg px-3.5 py-3 text-sm font-semibold text-erro-tx">
          {mensagemDeErro(repetir.error)}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2.5">
        <button type="button" onClick={onFechar} className={botao({ tipo: 'secundario' })}>
          Cancelar
        </button>
        <button
          type="button"
          disabled={marcadas.length === 0 || repetir.isPending}
          aria-busy={repetir.isPending}
          onClick={() =>
            repetir.mutate({ mes, ids: marcadas.map((t) => t.id) }, { onSuccess: (criadas) => onLancadas(criadas.length) })
          }
          className={botao({ tipo: 'primario' })}
        >
          <Repeat aria-hidden="true" />
          Lançar {plural(marcadas.length)}
        </button>
      </div>
    </div>
  )
}
