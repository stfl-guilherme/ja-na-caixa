/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type ProxyOptions } from 'vite'

const DJANGO = 'http://localhost:8000'
const ORIGEM_LOCAL = 'http://localhost:5173'

/**
 * Proxy de /api para o Django. Pela rede local (celular, ADR-020) o navegador usa
 * o IP do computador, que muda a cada rede; o proxy se apresenta sempre como
 * localhost (Host e Origin), então o Django não precisa conhecer esse IP.
 * O token CSRF continua sendo exigido.
 */
const proxyApi: ProxyOptions = {
  target: DJANGO,
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on('proxyReq', (requisicao) => {
      if (requisicao.getHeader('origin')) requisicao.setHeader('origin', ORIGEM_LOCAL)
    })
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // Mesma origem para o navegador: cookie de sessão e CSRF sem CORS (ADR-002).
    // `vite preview` usa o mesmo proxy (npm run celular).
    proxy: { '/api': proxyApi },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
