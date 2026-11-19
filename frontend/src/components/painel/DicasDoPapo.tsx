// Dicas do Papo (spec 17.2): o texto é informação real; a imagem continua decorativa.
import { ChevronRight, Lightbulb } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Dica } from '@/api/types'
import { Personagem } from '@/components/Personagem'
import { botao } from '@/components/ui/botao'
import { POSE_DA_DICA, ROTULO_DA_DICA, rotuloDoLink } from '@/lib/dicas'
import { cn } from '@/lib/utils'

interface DicasDoPapoProps {
  dicas: Dica[]
  indice: number
  onProxima: () => void
  /**
   * `cartao`: mobile, cartão de largura total com o Papo pequeno à esquerda.
   * `vazio`: dentro do estado vazio, saindo do Papo da cadeira (sem imagem nova).
   * `flutuante`: desktop ≥ 1024px, balão abaixo do botão "cabeça de chat" (sem imagem própria).
   */
  variante: 'cartao' | 'vazio' | 'flutuante'
}

export function DicasDoPapo({ dicas, indice, onProxima, variante }: DicasDoPapoProps) {
  if (dicas.length === 0) return null
  const dica = dicas[indice % dicas.length]
  const posicao = (indice % dicas.length) + 1

  return (
    <section
      aria-label="Dicas do Papo"
      data-tipo={dica.tipo}
      className={cn(
        'relative flex gap-3 bg-branco text-left',
        variante === 'cartao' && 'items-start rounded-cartao px-4 py-3.5 shadow-cartao',
        variante === 'vazio' && 'w-full max-w-[460px] rounded-[18px] border-2 border-tinta px-[18px] py-3.5',
        variante === 'flutuante' && 'rounded-[18px] border-2 border-tinta py-3.5 pr-12 pl-[18px] shadow-modal',
      )}
    >
      {variante === 'cartao' && <Personagem pose={POSE_DA_DICA[dica.tipo]} altura={48} className="mt-0.5 max-w-12 shrink-0 object-contain" />}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold tracking-[0.3px] text-texto-2 uppercase">
          <Lightbulb className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
          Dica do Papo · {ROTULO_DA_DICA[dica.tipo]}
        </span>
        <p aria-live="polite" className="m-0 text-[15px] leading-snug font-bold text-tinta">
          {dica.texto}
        </p>
        {(dica.link || dicas.length > 1) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {dica.link && (
              <Link to={dica.link} className="inline-flex min-h-11 items-center gap-1 px-1 text-sm font-bold text-verde-700 no-underline">
                {rotuloDoLink(dica.link)}
                <ChevronRight className="size-4" strokeWidth={2.5} aria-hidden="true" />
              </Link>
            )}
            {dicas.length > 1 && (
              <button type="button" onClick={onProxima} className={cn(botao({ tipo: 'secundario' }), 'ml-auto min-h-11 px-3.5 text-sm')}>
                Próxima dica ({posicao}/{dicas.length})
              </button>
            )}
          </div>
        )}
      </div>
      {/* Ponta do balão: aponta para o Papo (acima à direita, para o botão flutuante; abaixo à esquerda no estado vazio). */}
      {variante !== 'cartao' && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute size-5 rotate-45 border-tinta bg-branco',
            variante === 'flutuante' ? '-top-[11px] right-[20px] border-t-2 border-l-2' : '-bottom-[11px] left-[72px] border-r-2 border-b-2',
          )}
        />
      )}
    </section>
  )
}
