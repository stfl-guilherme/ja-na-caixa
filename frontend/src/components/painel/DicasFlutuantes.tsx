// Dicas do Papo no desktop (≥ 1024px) como "cabeça de chat" (spec 17.2; decisoes-de-design, seção 5):
// botão redondo no canto superior direito, na barra fixa do título; o balão abre abaixo dele.
import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import type { Dica } from '@/api/types'
import { Personagem } from '@/components/Personagem'
import { botaoIcone } from '@/components/ui/botao'
import { fotosDoBotao } from '@/lib/dicas'
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

/** Diâmetro interno do botão (60px − borda de 2px). */
const DIAMETRO = 56

/**
 * Recorte do rosto no círculo: `fx`/`fy` = centro do rosto na imagem (0–1), `largura` = largura
 * da imagem em px. A imagem é posicionada para o rosto cair no centro do círculo.
 */
const ROSTO: Partial<Record<Pose, { fx: number; fy: number; largura: number; proporcao: number }>> = {
  'papo-preocupado': { fx: 0.5, fy: 0.2, largura: 82, proporcao: 618 / 491 },
  'papo-joinha': { fx: 0.43, fy: 0.21, largura: 92, proporcao: 617 / 513 },
  'papo-animado': { fx: 0.57, fy: 0.21, largura: 92, proporcao: 570 / 511 },
  'papo-sentado-moeda': { fx: 0.52, fy: 0.2, largura: 96, proporcao: 732 / 690 },
  'papo-espiando-lado': { fx: 0.58, fy: 0.17, largura: 52, proporcao: 732 / 379 },
}

function estiloDoRosto(pose: Pose): CSSProperties {
  const r = ROSTO[pose]
  if (!r) return { width: '100%', height: '100%', objectFit: 'cover' }
  const altura = r.largura * r.proporcao
  return {
    position: 'absolute',
    width: r.largura,
    height: altura,
    maxWidth: 'none',
    left: DIAMETRO / 2 - r.fx * r.largura,
    top: DIAMETRO / 2 - r.fy * altura,
  }
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
  // A foto acompanha a dica exibida (troca com "Próxima dica"), uma diferente para cada dica.
  const pose = fotosDoBotao(dicas.map((d) => d.tipo))[indice % dicas.length]
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
          className="fixed top-24 right-10 z-40 w-[400px] max-w-[calc(100vw-248px-80px)] rounded-[18px] focus:outline-none"
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
        className="fixed top-4 right-10 z-40 size-[60px] cursor-pointer rounded-full border-2 border-tinta bg-branco p-0 shadow-cartao hover:brightness-105"
      >
        <span className="relative block size-full overflow-hidden rounded-full">
          <Personagem pose={pose} style={estiloDoRosto(pose)} />
        </span>
        <span
          aria-hidden="true"
          className="absolute -top-[13px] -right-[13px] flex size-5 items-center justify-center rounded-full bg-tinta text-xs leading-none font-extrabold text-branco"
        >
          !
        </span>
      </button>
    </>
  )
}
