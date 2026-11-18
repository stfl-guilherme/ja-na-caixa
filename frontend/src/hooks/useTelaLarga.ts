import { useSyncExternalStore } from 'react'

/** Breakpoint único do design (docs/design/README.md, "Layout responsivo"). */
export const LARGURA_LARGA = '(min-width: 720px)'

function assinar(avisar: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {}
  const consulta = window.matchMedia(LARGURA_LARGA)
  consulta.addEventListener('change', avisar)
  return () => consulta.removeEventListener('change', avisar)
}

/** true a partir de 720px. Sem `matchMedia` (jsdom), assume desktop. */
export function useTelaLarga(): boolean {
  return useSyncExternalStore(assinar, () =>
    typeof window.matchMedia === 'function' ? window.matchMedia(LARGURA_LARGA).matches : true,
  )
}

/** Usuário pediu menos movimento. */
export function prefereMenosMovimento(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
