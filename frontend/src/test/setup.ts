import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// O jsdom não implementa ResizeObserver, usado pelo ResponsiveContainer do Recharts.
class ResizeObserverFalso {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverFalso as unknown as typeof ResizeObserver

// O jsdom não implementa matchMedia. Padrão dos testes: tela larga (≥ 720px) e
// movimento reduzido, para as páginas renderizarem os valores finais sem esperar animação.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = ((consulta: string) => ({
    matches: consulta.includes('min-width') || consulta.includes('reduce'),
    media: consulta,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}
