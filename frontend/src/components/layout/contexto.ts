import { createContext, useContext, useEffect } from 'react'
import type { Transacao } from '@/api/types'

export interface InterfaceApp {
  /** Abre o modal de transação: sem argumento cria, com transação edita. */
  abrirTransacao: (transacao?: Transacao) => void
  /** Abre o modal de nova categoria (onboarding do Painel). */
  abrirCategoria: () => void
  /** Abre a confirmação de exclusão da transação. */
  pedirExclusao: (transacao: Transacao) => void
  /** Aviso de sucesso com o Papo joinha (some sozinho em 5s). */
  avisar: (mensagem: string) => void
  avisoAberto: boolean
  /** Esconde o Papo do menu lateral (limite de 2 personagens por tela). */
  setOcultarPapoDoMenu: (ocultar: boolean) => void
}

export const InterfaceContext = createContext<InterfaceApp | null>(null)

export function useInterface(): InterfaceApp {
  const contexto = useContext(InterfaceContext)
  if (!contexto) throw new Error('useInterface precisa estar dentro do Layout')
  return contexto
}

/**
 * A página avisa que já mostra 2 personagens (estado vazio com coadjuvante),
 * e o Papo do menu lateral some enquanto isso for verdade.
 */
export function useOcultarPapoDoMenu(ocultar: boolean) {
  const { setOcultarPapoDoMenu } = useInterface()
  useEffect(() => {
    setOcultarPapoDoMenu(ocultar)
    return () => setOcultarPapoDoMenu(false)
  }, [ocultar, setOcultarPapoDoMenu])
}
