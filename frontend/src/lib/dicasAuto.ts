// Abertura automática das Dicas do Papo no desktop (spec 17.2): só com alerta, uma vez por
// usuário e por mês visualizado. Guardado no localStorage; se ele falhar, não abre sozinho.
import type { Dica } from '@/api/types'

export const chaveDicaAuto = (usuario: string, mes: string) => `jnc:dicas-auto:${usuario || 'anonimo'}:${mes}`

/** Só leitura (pode rodar duas vezes no StrictMode): `true` se ainda não abriu sozinho neste mês. */
export function podeAbrirSozinho(dicas: Dica[], usuario: string, mes: string): boolean {
  if (!dicas.some((d) => d.tipo === 'alerta')) return false
  try {
    return window.localStorage.getItem(chaveDicaAuto(usuario, mes)) === null
  } catch {
    return false
  }
}

/** Registra que já abriu sozinho; falhas do storage são ignoradas. */
export function marcarAbertoSozinho(usuario: string, mes: string) {
  try {
    window.localStorage.setItem(chaveDicaAuto(usuario, mes), '1')
  } catch {
    // sem storage: na próxima visita também não abre (podeAbrirSozinho devolve false)
  }
}
