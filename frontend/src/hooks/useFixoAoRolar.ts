import { useEffect, useRef, useState } from 'react'

/**
 * Diz se a barra `sticky` já está grudada no topo: observa um marcador de 1px logo
 * acima dela; quando o marcador sai da tela, a barra está fixa. Sem IntersectionObserver
 * (jsdom), fica `false` (barra transparente, como no topo da página).
 */
export function useFixoAoRolar<T extends HTMLElement>() {
  const marcador = useRef<T>(null)
  const [fixo, setFixo] = useState(false)
  useEffect(() => {
    const alvo = marcador.current
    if (!alvo || typeof IntersectionObserver !== 'function') return
    const observador = new IntersectionObserver(([entrada]) => setFixo(!entrada.isIntersecting))
    observador.observe(alvo)
    return () => observador.disconnect()
  }, [])
  return { marcador, fixo }
}
