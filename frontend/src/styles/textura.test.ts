/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { contraste, misturar } from '@/lib/contraste'

// Lido do disco: com `css: false` no Vitest, imports de CSS chegam vazios.
const indexCss = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
const tokensCss = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8')
const bloco = indexCss.match(/\.fundo-areia \{([\s\S]*?)\n\}/)?.[1] ?? ''
const token = (nome: string) => tokensCss.match(new RegExp(`--jnc-${nome}:\\s*(#[0-9A-Fa-f]{6})`))?.[1] ?? ''

const opacidade = Number(bloco.match(/opacity='([\d.]+)'/)?.[1])
const fundo = token('fundo-app')
const grao = token('borda-areia')
// Pior caso: um grão com alfa máximo (1) multiplicado pela opacidade do retângulo.
const fundoMaisEscuro = misturar(fundo, grao, opacidade)

describe('textura de areia', () => {
  it('é ruído SVG em data URI, sem imagem externa', () => {
    expect(bloco).toContain('feTurbulence')
    expect(bloco).toContain('url("data:image/svg+xml,')
    expect(bloco).not.toMatch(/\.(png|jpe?g|webp)/)
  })

  it('opacidade entre 2% e 4%', () => {
    expect(opacidade).toBeGreaterThanOrEqual(0.02)
    expect(opacidade).toBeLessThanOrEqual(0.04)
  })

  it('rola com a página (sem background-attachment: fixed)', () => {
    expect(bloco).not.toMatch(/background-attachment/)
  })

  it('títulos e descrições sobre o fundo continuam ≥ 4,5:1 no pior grão', () => {
    expect(contraste(token('tinta'), fundoMaisEscuro)).toBeGreaterThanOrEqual(4.5)
    expect(contraste(token('texto-2'), fundoMaisEscuro)).toBeGreaterThanOrEqual(4.5)
  })
})
