import { AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { idErro } from '@/lib/campos'
import { cn } from '@/lib/utils'

interface CampoProps {
  id: string
  rotulo: ReactNode
  obrigatorio?: boolean
  erro?: string
  children: ReactNode
  className?: string
}

export function CampoFormulario({ id, rotulo, obrigatorio = false, erro, children, className }: CampoProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-tinta">
        {rotulo}
        {obrigatorio && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {erro && <MensagemErro id={idErro(id)}>{erro}</MensagemErro>}
    </div>
  )
}

export function MensagemErro({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="m-0 flex gap-1.5 text-[13px] font-semibold text-erro">
      <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}
