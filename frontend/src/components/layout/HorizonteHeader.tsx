// Faixa de horizonte no topo das telas internas (decisoes-de-design, "Fundo das telas internas").
// Recriada da referência docs/design/referencias/horizonte-referencia.png: céu, duas faixas de mar
// com ondas suaves, espuma e areia; duas nuvens à direita. Chapada, sem contorno, sem animação.
import { useId, type CSSProperties } from 'react'
import { caminhoOnda, LARGURA } from '@/lib/horizonte'
import { cn } from '@/lib/utils'

export function HorizonteHeader({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, '')
  return (
    <div aria-hidden="true" data-testid="horizonte" className={cn('pointer-events-none select-none', className)} style={style}>
      <svg className="absolute inset-0 size-full" viewBox={`0 0 ${LARGURA} 100`} preserveAspectRatio="none" focusable="false">
        <rect width={LARGURA} height="55.5" fill="var(--horizonte-ceu)" />
        <rect y="55" width={LARGURA} height="12" fill="var(--horizonte-mar-1)" />
        <path d={caminhoOnda(65.5, 0.6, 5, 86)} fill="var(--horizonte-mar-crista)" />
        <path d={caminhoOnda(70.5, 0.5, 6, 86)} fill="var(--horizonte-mar-2)" />
        <path d={caminhoOnda(85, 0.6, 4, 89.5)} fill="var(--horizonte-espuma)" />
      </svg>
      {/* Nuvens num SVG próprio, ancorado à direita e sem distorção (meet). */}
      <svg className="absolute inset-0 size-full" viewBox="0 0 400 160" preserveAspectRatio="xMaxYMin meet" focusable="false">
        <defs>
          <clipPath id={`${id}-n1`}>
            <rect x="900" y="100" width="200" height="54" />
          </clipPath>
          <clipPath id={`${id}-n2`}>
            <rect x="790" y="140" width="140" height="40" />
          </clipPath>
        </defs>
        {/* Coordenadas da referência (1024 × 434), reduzidas pela metade e ancoradas na borda direita. */}
        <g transform="translate(400 -22) scale(0.5) translate(-1024 0)" fill="var(--horizonte-nuvem)">
          <g clipPath={`url(#${id}-n1)`}>
            <circle cx="1012" cy="146" r="30" />
            <circle cx="968" cy="144.5" r="14.5" />
            <rect x="926" y="140" width="110" height="14" rx="7" />
          </g>
          <g clipPath={`url(#${id}-n2)`}>
            <circle cx="845" cy="176.6" r="19.6" />
            <circle cx="873" cy="172" r="12" />
            <circle cx="818" cy="174" r="6" />
            <rect x="806" y="170" width="102" height="10" rx="5" />
          </g>
        </g>
      </svg>
    </div>
  )
}
