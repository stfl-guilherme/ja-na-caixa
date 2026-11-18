import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ConfirmDialogProps {
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
  titulo: string
  descricao: string
  confirmarRotulo?: string
  onConfirmar: () => void
  carregando?: boolean
  erro?: string | null
}

export function ConfirmDialog({
  aberto,
  onAbertoChange,
  titulo,
  descricao,
  confirmarRotulo = 'Excluir',
  onConfirmar,
  carregando = false,
  erro,
}: ConfirmDialogProps) {
  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent role="alertdialog" className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        {erro && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {erro}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onAbertoChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirmar} loading={carregando}>
            {confirmarRotulo}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
