import { ArrowDownUp, LayoutDashboard, Tag } from 'lucide-react'

export const ITENS_MENU = [
  { to: '/', rotulo: 'Painel', Icone: LayoutDashboard, end: true },
  { to: '/transacoes', rotulo: 'Transações', Icone: ArrowDownUp, end: false },
  { to: '/categorias', rotulo: 'Categorias', Icone: Tag, end: false },
] as const
