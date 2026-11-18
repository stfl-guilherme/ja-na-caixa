import { AlertCircle, Inbox } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { mensagemDeErro } from '@/lib/erros'

export function EstadoVazio({ titulo, descricao, acao }: { titulo: string; descricao?: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-card px-6 py-12 text-center">
      <Inbox className="size-10 text-muted-foreground" aria-hidden="true" />
      <p className="font-medium">{titulo}</p>
      {descricao && <p className="max-w-sm text-sm text-muted-foreground">{descricao}</p>}
      {acao}
    </div>
  )
}

export function EstadoErro({ erro, onTentarNovamente }: { erro: unknown; onTentarNovamente?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
      <p className="text-sm text-destructive">{mensagemDeErro(erro)}</p>
      {onTentarNovamente && (
        <Button variant="outline" size="sm" onClick={onTentarNovamente}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
