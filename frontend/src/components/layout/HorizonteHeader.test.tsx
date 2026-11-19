/// <reference types="node" />
import { act, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { contraste } from '@/lib/contraste'
import { CabecalhoPagina } from './CabecalhoPagina'
import { HorizonteHeader } from './HorizonteHeader'

const tokensCss = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8')
const cor = (variavel: string) => tokensCss.match(new RegExp(`${variavel}:\\s*(#[0-9A-Fa-f]{6})`))?.[1] ?? ''

describe('HorizonteHeader', () => {
  it('título sobre o céu tem contraste ≥ 4,5:1 (WCAG AA)', () => {
    const ceu = cor('--horizonte-ceu')
    expect(ceu).toBe('#D5ECF3')
    expect(contraste(cor('--jnc-tinta'), ceu)).toBeGreaterThanOrEqual(4.5)
  })

  it('define os tokens amostrados da referência', () => {
    for (const nome of ['--horizonte-ceu', '--horizonte-mar-1', '--horizonte-mar-2', '--horizonte-espuma']) {
      expect(cor(nome)).toMatch(/^#[0-9A-F]{6}$/)
    }
  })

  it('é decorativo e sem animação', () => {
    render(<HorizonteHeader />)
    const faixa = screen.getByTestId('horizonte')
    expect(faixa).toHaveAttribute('aria-hidden', 'true')
    expect(faixa.querySelector('animate, animateTransform')).toBeNull()
    expect(faixa.className).not.toMatch(/animate/)
  })

  it('faixas esticam na horizontal; nuvens ancoradas à direita sem distorcer', () => {
    render(<HorizonteHeader />)
    const [faixas, nuvens] = screen.getByTestId('horizonte').querySelectorAll(':scope > svg')
    expect(faixas).toHaveAttribute('preserveAspectRatio', 'none')
    expect(nuvens).toHaveAttribute('preserveAspectRatio', 'xMaxYMin meet')
  })

  it('não pinta a areia: abaixo da espuma aparece o próprio fundo da página', () => {
    render(<HorizonteHeader />)
    const faixas = screen.getByTestId('horizonte').querySelector('svg')!
    const fills = [...faixas.querySelectorAll('[fill]')].map((el) => el.getAttribute('fill'))
    expect(fills).toEqual([
      'var(--horizonte-ceu)',
      'var(--horizonte-mar-1)',
      'var(--horizonte-mar-crista)',
      'var(--horizonte-mar-2)',
      'var(--horizonte-espuma)',
    ])
  })
})

describe('barra superior fixa', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('transparente no topo; ao grudar, ganha fundo, sombra e borda', () => {
    let avisar: (entradas: { isIntersecting: boolean }[]) => void = () => {}
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: typeof avisar) {
          avisar = cb
        }
        observe() {}
        disconnect() {}
      },
    )
    render(
      <MemoryRouter>
        <CabecalhoPagina titulo="Painel" />
      </MemoryRouter>,
    )
    const barra = screen.getByRole('banner')
    expect(barra).toHaveAttribute('data-fixo', 'false')
    expect(barra).toHaveClass('bg-transparent', 'border-transparent')

    act(() => avisar([{ isIntersecting: false }]))
    expect(barra).toHaveAttribute('data-fixo', 'true')
    expect(barra).toHaveClass('bg-fundo-app', 'border-borda-sutil')
    expect(barra.className).toMatch(/shadow-/)

    act(() => avisar([{ isIntersecting: true }]))
    expect(barra).toHaveAttribute('data-fixo', 'false')
  })
})
