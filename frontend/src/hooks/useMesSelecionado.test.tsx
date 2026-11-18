import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMesSelecionado } from './useMesSelecionado'

function envolver(caminho: string) {
  return ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[caminho]}>{children}</MemoryRouter>
}

function useComLocalizacao() {
  return { ...useMesSelecionado(), location: useLocation() }
}

describe('useMesSelecionado', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 17))
  })
  afterEach(() => vi.useRealTimers())

  it('usa o mês atual sem parâmetro', () => {
    const { result } = renderHook(() => useMesSelecionado(), { wrapper: envolver('/') })
    expect(result.current.mes).toBe('2026-11')
  })

  it('lê ?mes= da URL', () => {
    const { result } = renderHook(() => useMesSelecionado(), { wrapper: envolver('/transacoes?mes=2025-12') })
    expect(result.current.mes).toBe('2025-12')
  })

  it('ignora um mês inválido na URL', () => {
    const { result } = renderHook(() => useMesSelecionado(), { wrapper: envolver('/?mes=2026-13') })
    expect(result.current.mes).toBe('2026-11')
  })

  it('troca o mês preservando os outros parâmetros e voltando para a página 1', () => {
    const { result } = renderHook(() => useComLocalizacao(), {
      wrapper: envolver('/transacoes?tipo=DESPESA&page=3'),
    })
    act(() => result.current.setMes('2026-10'))
    const busca = new URLSearchParams(result.current.location.search)
    expect(busca.get('mes')).toBe('2026-10')
    expect(busca.get('tipo')).toBe('DESPESA')
    expect(busca.get('page')).toBeNull()
  })

  it('monta links que carregam o mês escolhido', () => {
    const { result } = renderHook(() => useMesSelecionado(), { wrapper: envolver('/?mes=2026-09') })
    expect(result.current.comMes('/categorias')).toBe('/categorias?mes=2026-09')
    expect(result.current.comMes('/transacoes', { tipo: 'RECEITA' })).toBe('/transacoes?mes=2026-09&tipo=RECEITA')
  })
})
