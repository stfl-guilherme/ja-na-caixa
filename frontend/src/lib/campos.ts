// Classes e atributos compartilhados pelos campos de formulário do design.
import { cn } from '@/lib/utils'

/** Moldura de campo do design: 48px, raio 12, borda 1.5px; com erro, borda 2px vermelha. */
export function molduraCampo(comErro: boolean) {
  return cn(
    'flex h-12 items-center gap-2 rounded-campo bg-branco px-3 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-tinta',
    comErro ? 'border-2 border-erro' : 'border-[1.5px] border-borda-campo',
  )
}

export const classeInputLimpo =
  'h-full min-w-0 flex-1 border-0 bg-transparent text-base font-medium text-tinta outline-none placeholder:text-texto-2/80'

export function idErro(id: string) {
  return `${id}-erro`
}

/** Atributos para ligar o campo à mensagem de erro (aria-invalid + aria-describedby). */
export function ariaDoCampo(id: string, erro?: string, extraDescricao?: string) {
  const descricao = [extraDescricao, erro ? idErro(id) : undefined].filter(Boolean).join(' ')
  return {
    'aria-invalid': erro ? true : undefined,
    'aria-describedby': descricao || undefined,
  }
}
