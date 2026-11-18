// Baseado no Dialog do shadcn/ui (MIT), sobre @radix-ui/react-dialog (ADR-007).
// Radix cuida do focus trap, do Esc e de devolver o foco a quem abriu o modal.
// Visual: docs/design/telas/app/transacoes/Transacoes.dc.html (modal) — no celular vira folha inferior.
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

interface DialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  /** Diálogos de confirmação ficam centralizados também no celular. */
  centralizado?: boolean
  semFechar?: boolean
}

export function DialogContent({ className, children, centralizado = false, semFechar = false, ...props }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--jnc-overlay)]" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 z-50 flex max-h-[94vh] w-full -translate-x-1/2 flex-col overflow-y-auto bg-branco px-6 pt-[22px] pb-6 text-tinta shadow-modal focus-visible:outline-none',
          centralizado
            ? 'top-1/2 w-[calc(100%-32px)] -translate-y-1/2 rounded-cartao'
            : 'bottom-0 rounded-t-cartao largo:top-1/2 largo:bottom-auto largo:w-[calc(100%-48px)] largo:-translate-y-1/2 largo:rounded-cartao',
          'max-w-[540px]',
          className,
        )}
        {...props}
      >
        {children}
        {!semFechar && (
          <DialogPrimitive.Close
            aria-label="Fechar"
            className="absolute top-4 right-4 inline-flex size-11 cursor-pointer items-center justify-center rounded-[10px] text-texto-3 hover:bg-fundo-app"
          >
            <X className="size-5" strokeWidth={2.4} aria-hidden="true" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1 pr-12', className)} {...props} />
}

export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-wrap items-center justify-end gap-2.5', className)} {...props} />
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('m-0 text-xl font-extrabold', className)} {...props} />
}

export function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn('m-0 text-[13px] font-medium text-texto-2', className)} {...props} />
}
