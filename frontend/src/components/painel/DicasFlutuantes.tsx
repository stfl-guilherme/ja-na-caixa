// Dicas do Papo no desktop (≥ 1024px) como "cabeça de chat" (spec 17.2; decisoes-de-design, seção 5):
// botão redondo no canto superior direito, na barra fixa do título; o balão abre abaixo dele.
import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { Dica } from '@/api/types'
import { Personagem } from '@/components/Personagem'
import { botaoIcone } from '@/components/ui/botao'
import { POSE_DA_DICA } from '@/lib/dicas'
import type { Pose } from '@/lib/personagens'
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

/** Recorte de cada pose no círculo: o rosto do Papo fica centralizado. */
const ENQUADRAMENTO: Partial<Record<Pose, string>> = {
  'papo-espiando': '46% 100%',
  'papo-preocupado': '50% 0%',
  'papo-joinha': '50% 0%',
}

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
  // A pose acompanha o tipo da dica exibida (troca com "Próxima dica").
  const pose = POSE_DA_DICA[dicas[indice % dicas.length].tipo]
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
        // Abaixo do botão e da barra fixa do título (72px), alinhado à direita: não cobre o seletor
        // de mês (na barra, à esquerda) nem o "+ Nova transação" (menu lateral). A largura nunca
        // passa da área de conteúdo (100vw − menu de 248px − margens).
        <div
          ref={balaoRef}
          id={idBalao}
          tabIndex={-1}
          data-testid="balao-dicas"
          className="fixed top-[86px] right-10 z-40 w-[400px] max-w-[calc(100vw-248px-80px)] rounded-[18px] focus:outline-none"
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
        className="fixed top-[6px] right-10 z-40 size-[60px] cursor-pointer rounded-full border-2 border-tinta bg-branco p-0 shadow-cartao hover:brightness-105"
      >
        <span className="block size-full overflow-hidden rounded-full">
          <Personagem pose={pose} className="size-full object-cover" style={{ objectPosition: ENQUADRAMENTO[pose] }} />
        </span>
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-branco bg-tinta text-xs font-extrabold text-branco"
        >
          ?
        </span>
      </button>
    </>
  )
}
