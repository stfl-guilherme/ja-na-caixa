// Campo de formulário com rótulo e mensagem de erro vinda da API.
import type { ReactNode } from 'react'
import { Label } from './label'

interface FieldProps {
  id: string
  label: string
  erros?: string[]
  children: ReactNode
}

export function Field({ id, label, erros, children }: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {erros?.length ? (
        <div id={`${id}-erro`} className="grid gap-0.5 text-sm text-destructive" role="alert">
          {erros.map((erro) => (
            <p key={erro}>{erro}</p>
          ))}
        </div>
      ) : null}
    </div>
  )
}
