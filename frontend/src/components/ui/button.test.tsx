import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('repassa o clique', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Salvar</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('aplica a variante destrutiva', () => {
    render(<Button variant="destructive">Excluir</Button>)
    expect(screen.getByRole('button', { name: 'Excluir' }).className).toMatch(/bg-destructive/)
  })

  it('fica desabilitado e não dispara clique quando carregando', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Salvar
      </Button>,
    )
    const botao = screen.getByRole('button', { name: /salvar/i })
    expect(botao).toBeDisabled()
    await userEvent.click(botao)
    expect(onClick).not.toHaveBeenCalled()
  })
})
