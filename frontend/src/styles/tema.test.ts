/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Lido do disco: com `css: false` no Vitest, imports de CSS chegam vazios.
const ler = (caminho: string) => readFileSync(new URL(caminho, import.meta.url), 'utf8')
const indexCss = ler('../index.css')
const tokensCss = ler('./tokens.css')

const definidos = new Set([...tokensCss.matchAll(/(--jnc-[\w-]+)\s*:/g)].map((m) => m[1]))
const blocoTema = indexCss.match(/@theme inline \{([\s\S]*?)\n\}/)?.[1] ?? ''

describe('tema do Tailwind', () => {
  it('importa os tokens do design', () => {
    expect(indexCss).toContain("@import './styles/tokens.css'")
  })

  it('usa apenas variáveis --jnc-* que existem em tokens.css', () => {
    const usados = [...blocoTema.matchAll(/var\((--jnc-[\w-]+)\)/g)].map((m) => m[1])
    expect(usados.length).toBeGreaterThan(20)
    expect(usados.filter((nome) => !definidos.has(nome))).toEqual([])
  })

  it('não define cores soltas no tema', () => {
    const cores = [...blocoTema.matchAll(/--color-[\w-]+:\s*([^;]+);/g)].map((m) => m[1].trim())
    expect(cores.filter((valor) => !valor.startsWith('var(--jnc-'))).toEqual([])
  })
})
