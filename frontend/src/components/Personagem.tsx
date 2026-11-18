import type { CSSProperties, ReactNode } from 'react'
import { ESPIANDO_VISIVEL_PX, PERSONAGENS, type Pose } from '@/lib/personagens'
import { cn } from '@/lib/utils'

interface PersonagemProps {
  pose: Pose
  /** Altura da imagem em px; a largura segue a proporção do PNG. Sem altura, o tamanho vem da classe. */
  altura?: number
  className?: string
  style?: CSSProperties
}

/**
 * Papo e coadjuvantes são decoração (decisoes-de-design, seção 6): `alt=""` e
 * `aria-hidden`, nenhuma informação só neles, sem animação contínua.
 */
export function Personagem({ pose, altura, className, style }: PersonagemProps) {
  return (
    <img
      src={PERSONAGENS[pose]}
      alt=""
      aria-hidden="true"
      draggable={false}
      data-personagem={pose}
      className={cn('pointer-events-none block w-auto select-none', className)}
      style={{ ...(altura !== undefined && { height: `${altura}px` }), ...style }}
    />
  )
}

interface EspiandoProps {
  /** `null` esconde o personagem (ex.: para respeitar o limite de 2 por tela). */
  pose: Pose | null
  altura: number
  /** Quanto da imagem fica acima da borda do cartão, em px (máximo 72). */
  visivel?: number
  /** Distância da borda direita do cartão, em px, ou 'centro'. */
  direita?: number | 'centro'
  /** Inclinação sutil no hover; desligada com prefers-reduced-motion. */
  inclinar?: boolean
  className?: string
  children: ReactNode
}

/**
 * Efeito "espiando": a imagem fica atrás do cartão (z-0) e só a cabeça
 * aparece acima da borda, no máximo 72px.
 */
export function Espiando({
  pose,
  altura,
  visivel = ESPIANDO_VISIVEL_PX,
  direita = 22,
  inclinar = true,
  className,
  children,
}: EspiandoProps) {
  const acima = Math.min(visivel, ESPIANDO_VISIVEL_PX)
  const posicao: CSSProperties =
    direita === 'centro' ? { top: `-${acima}px`, left: '50%', translate: '-50% 0' } : { top: `-${acima}px`, right: `${direita}px` }
  return (
    <div className={cn('group/espiando relative min-w-0', className)}>
      {pose && (
        <Personagem
          pose={pose}
          altura={altura}
          className={cn(
            'absolute z-0 origin-bottom transition-transform duration-200 motion-reduce:transition-none',
            inclinar && 'group-hover/espiando:-rotate-4 motion-reduce:group-hover/espiando:rotate-0',
          )}
          style={posicao}
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}
