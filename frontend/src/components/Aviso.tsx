import { X } from 'lucide-react'
import { Personagem } from '@/components/Personagem'
import { botaoIcone } from '@/components/ui/botao'
import { cn } from '@/lib/utils'

/** Toast de sucesso com o Papo joinha de 40px (docs/design/telas/app/transacoes/Transacoes_Salva.dc.html). */
export function Aviso({ mensagem, onFechar }: { mensagem: string; onFechar: () => void }) {
  return (
    <div
      role="status"
      className={cn(
        'fixed z-60 ml-auto flex max-w-[420px] items-center gap-3 rounded-[14px] border border-toast-borda bg-branco py-2.5 pr-2 pl-3 shadow-[0_12px_32px_rgba(20,32,40,0.18)]',
        'inset-x-4 bottom-[88px] largo:right-6 largo:bottom-6 largo:left-auto',
        'animate-[entrada_200ms_ease-out] motion-reduce:animate-none',
      )}
    >
      <Personagem pose="papo-joinha" altura={40} className="shrink-0" />
      <span className="flex-1 text-[15px] font-bold text-tinta">{mensagem}</span>
      <button type="button" onClick={onFechar} aria-label="Fechar aviso" className={botaoIcone}>
        <X className="size-5!" strokeWidth={2.4} aria-hidden="true" />
      </button>
    </div>
  )
}
