// Dicas do Papo no desktop (≥ 1024px) como "cabeça de chat" (spec 17.2; decisoes-de-design, seção 5):
// botão redondo no canto inferior direito; o balão abre acima dele.
import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { Dica } from '@/api/types'
import { Personagem } from '@/components/Personagem'
import { botaoIcone } from '@/components/ui/botao'
import { POSE_DA_DICA } from '@/lib/dicas'
import { marcarAbertoSozinho, podeAbrirSozinho } from '@/lib/dicasAuto'
import { cn } from '@/lib/utils'
import { DicasDoPapo } from './DicasDoPapo'

interface DicasFlutuantesProps {
  dicas: Dica[]
  indice: number
  onProxima: () => void
  usuario: string
  /** Mês visualizado (a abertura automática vale uma vez por mês). */
  mes: string
}

// Montado com as dicas já carregadas e com `key` pelo mês: a decisão de abrir sozinho é
// tomada uma vez, na montagem.

type Abertura = 'fechado' | 'clique' | 'auto'

export function DicasFlutuantes({ dicas, indice, onProxima, usuario, mes }: DicasFlutuantesProps) {
  // Abre sozinho só com alerta, uma vez por usuário e mês; não move o foco e anuncia o texto.
  const [abertura, setAbertura] = useState<Abertura>(() => (podeAbrirSozinho(dicas, usuario, mes) ? 'auto' : 'fechado'))
  const [anuncio] = useState(() =>
    abertura === 'auto' ? `Dica do Papo: ${dicas.find((d) => d.tipo === 'alerta')?.texto ?? ''}` : '',
  )
  const regiaoViva = useRef<HTMLDivElement>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const balaoRef = useRef<HTMLDivElement>(null)
  const idBalao = useId()
  const aberto = abertura !== 'fechado'

  const abriuSozinho = anuncio !== ''
  useEffect(() => {
    if (!abriuSozinho) return
    marcarAbertoSozinho(usuario, mes)
    // O texto entra depois da montagem: uma região viva que já nasce preenchida não é anunciada.
    if (regiaoViva.current) regiaoViva.current.textContent = anuncio
  }, [abriuSozinho, anuncio, usuario, mes])

  // Ao abrir por clique, o foco vai para o balão.
  useEffect(() => {
    if (abertura === 'clique') balaoRef.current?.focus()
  }, [abertura])

  useEffect(() => {
    if (!aberto) return
    const fechar = () => {
      // O foco volta ao botão se estava no balão (ou se o balão foi aberto por clique).
      const focoNoBalao = balaoRef.current?.contains(document.activeElement)
      setAbertura('fechado')
      if (focoNoBalao || abertura === 'clique') botaoRef.current?.focus()
    }
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar()
    }
    const cliqueFora = (e: PointerEvent | MouseEvent) => {
      const alvo = e.target as Node
      if (balaoRef.current?.contains(alvo) || botaoRef.current?.contains(alvo)) return
      setAbertura('fechado')
    }
    document.addEventListener('keydown', tecla)
    document.addEventListener('mousedown', cliqueFora)
    return () => {
      document.removeEventListener('keydown', tecla)
      document.removeEventListener('mousedown', cliqueFora)
    }
  }, [aberto, abertura])

  if (dicas.length === 0) return null
  const pose = POSE_DA_DICA[dicas[0].tipo]
  const total = dicas.length

  const fecharPeloBotao = () => {
    setAbertura('fechado')
    botaoRef.current?.focus()
  }

  return (
    <>
      {/* Anúncio da abertura automática (o balão novo não é lido sozinho por todos os leitores). */}
      <div ref={regiaoViva} aria-live="polite" className="sr-only" data-testid="anuncio-dica" />

      {aberto && (
        // Acima do botão, alinhado à direita, preso ao rodapé da tela: fica longe da barra do
        // seletor de mês (topo) e do "+ Nova transação" (menu lateral, à esquerda). A largura
        // nunca passa da área de conteúdo (100vw − menu de 248px − margens).
        <div
          ref={balaoRef}
          id={idBalao}
          tabIndex={-1}
          data-testid="balao-dicas"
          className="fixed right-6 bottom-[112px] z-40 w-[400px] max-w-[calc(100vw-248px-48px)] rounded-[18px] focus:outline-none"
        >
          <div className="relative">
            <DicasDoPapo dicas={dicas} indice={indice} onProxima={onProxima} variante="flutuante" />
            <button
              type="button"
              onClick={fecharPeloBotao}
              aria-label="Fechar dicas"
              className={cn(botaoIcone, 'absolute top-1.5 right-1.5 text-tinta')}
            >
              <X strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <button
        ref={botaoRef}
        type="button"
        aria-label={`Dicas do Papo, ${total} ${total === 1 ? 'dica' : 'dicas'}`}
        aria-expanded={aberto}
        aria-controls={aberto ? idBalao : undefined}
        onClick={() => setAbertura(aberto ? 'fechado' : 'clique')}
        className="fixed right-6 bottom-6 z-40 size-[72px] cursor-pointer rounded-full border-2 border-tinta bg-branco p-0 shadow-modal hover:brightness-105"
      >
        <span className="flex size-full items-end justify-center overflow-hidden rounded-full">
          <Personagem pose={pose} altura={64} className="max-w-[64px] object-contain object-bottom" />
        </span>
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-branco bg-tinta text-xs font-extrabold text-branco"
        >
          {total}
        </span>
      </button>
    </>
  )
}
