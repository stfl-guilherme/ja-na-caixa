import { cn } from '@/lib/utils'

/** Logotipo em texto, Baloo 2 800 (ADR-013). O mascote não entra no logo. */
export function Logo({ className }: { className?: string }) {
  return (
    <p className={cn('m-0 font-logo leading-none font-extrabold tracking-[-0.5px] text-tinta', className)}>
      <span className="text-verde-700">Já</span>NaCaixa
    </p>
  )
}
