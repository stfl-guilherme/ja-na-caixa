// Formas de pagamento (spec 17.3): rótulo e ícone. A ordem é a do select e do filtro.
import { ArrowLeftRight, Banknote, Barcode, CircleHelp, CreditCard, QrCode, Wallet, type LucideIcon } from 'lucide-react'
import type { FormaPagamento } from '@/api/types'

export const FORMAS_PAGAMENTO: { valor: FormaPagamento; rotulo: string; Icone: LucideIcon }[] = [
  { valor: 'PIX', rotulo: 'Pix', Icone: QrCode },
  { valor: 'CARTAO_CREDITO', rotulo: 'Cartão de crédito', Icone: CreditCard },
  { valor: 'CARTAO_DEBITO', rotulo: 'Cartão de débito', Icone: Wallet },
  { valor: 'DINHEIRO', rotulo: 'Dinheiro', Icone: Banknote },
  { valor: 'BOLETO', rotulo: 'Boleto', Icone: Barcode },
  { valor: 'TRANSFERENCIA', rotulo: 'Transferência', Icone: ArrowLeftRight },
  { valor: 'NAO_INFORMADO', rotulo: 'Não informado', Icone: CircleHelp },
]

export function formaPagamento(valor: FormaPagamento) {
  return FORMAS_PAGAMENTO.find((f) => f.valor === valor) ?? FORMAS_PAGAMENTO[FORMAS_PAGAMENTO.length - 1]
}

export function ehFormaPagamento(valor: string | null): valor is FormaPagamento {
  return FORMAS_PAGAMENTO.some((f) => f.valor === valor)
}
