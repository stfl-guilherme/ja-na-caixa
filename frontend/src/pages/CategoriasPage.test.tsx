import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Categoria, Resumo } from '@/api/types'
import { resumoNovembro } from '@/test/fixtures'
import { chamadas, mockFetch, personagensNaTela, renderComRotas } from '@/test/utils'
import CategoriasPage from './CategoriasPage'

const mercado: Categoria = { id: 3, nome: 'Mercado', tipo: 'DESPESA', cor: '#B5541A', limite_mensal: null, transacoes: 4, criado_em: '' }
const salario: Categoria = { id: 1, nome: 'Salário', tipo: 'RECEITA', cor: '#2F7D35', limite_mensal: null, transacoes: 0, criado_em: '' }
const viagem: Categoria = { id: 9, nome: 'Viagem', tipo: 'DESPESA', cor: '#123456', limite_mensal: null, transacoes: 0, criado_em: '' }
const resumo: Resumo = {
  ...resumoNovembro,
  por_categoria: [
    { categoria_id: 3, nome: 'Mercado', cor: '#B5541A', tipo: 'DESPESA', total: '844.55', quantidade: 4 },
  ],
}
const semNbsp = (t: string | null) => (t ?? '').replace(/ /g, ' ')

function rotas(categorias: Categoria[], extras: Parameters<typeof mockFetch>[0] = []) {
  return mockFetch([
    { caminho: '/api/categorias/', corpo: categorias },
    { caminho: '/api/resumo/', corpo: resumo },
    ...extras,
  ])
}

describe('CategoriasPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 17))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('separa as categorias por tipo, com quantidade e total do mês', async () => {
    rotas([mercado, salario])
    renderComRotas(<CategoriasPage />)
    const despesas = await screen.findByRole('region', { name: /^Despesas/ })
    const cartao = (await within(despesas).findByText('4 transações em novembro')).closest('li') as HTMLElement
    expect(within(cartao).getByText('Mercado')).toBeInTheDocument()
    expect(within(cartao).getByText('Despesa · cor laranja')).toBeInTheDocument()
    expect(semNbsp(within(cartao).getByText(/844,55/).textContent)).toBe('− R$ 844,55')
    const receitas = screen.getByRole('region', { name: /^Receitas/ })
    expect(within(receitas).getByText('Salário')).toBeInTheDocument()
    expect(within(receitas).getByText('0 transações em novembro')).toBeInTheDocument()
    expect(semNbsp(within(receitas).getByTestId('total-secao').textContent)).toBe('+ R$ 6.686,42 em novembro')
    expect(personagensNaTela()).toEqual(['papo-sentado-moeda'])
  })

  it('mostra o estado vazio com ação', async () => {
    rotas([])
    renderComRotas(<CategoriasPage />)
    expect(await screen.findByText('Nenhuma categoria cadastrada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar primeira categoria' })).toBeInTheDocument()
  })

  it('cria uma categoria escolhendo tipo e uma das 10 cores', async () => {
    const fetchMock = rotas([], [{ metodo: 'POST', caminho: '/api/categorias/', status: 201, corpo: { ...salario, id: 5, nome: 'Bônus' } }])
    const { interfaceApp } = renderComRotas(<CategoriasPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Nova categoria' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Nova categoria' })
    expect(within(dialogo).getAllByRole('radio', { name: /^(Azul|Laranja|Roxo|Mostarda|Petróleo|Rosa|Ardósia|Verde|Marrom|Magenta)$/ })).toHaveLength(10)
    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), 'Bônus')
    await userEvent.click(within(dialogo).getByRole('radio', { name: /Receita/ }))
    await userEvent.click(within(dialogo).getByRole('radio', { name: 'Verde' }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))
    await vi.waitFor(() => expect(chamadas(fetchMock, 'POST', '/api/categorias/')).toHaveLength(1))
    const [[, init]] = chamadas(fetchMock, 'POST', '/api/categorias/')
    expect(JSON.parse(String(init?.body))).toEqual({ nome: 'Bônus', tipo: 'RECEITA', cor: '#2F7D35', limite_mensal: null })
    await vi.waitFor(() => expect(interfaceApp.avisar).toHaveBeenCalledWith('Categoria salva.'))
  })

  it('pede o nome antes de salvar', async () => {
    const fetchMock = rotas([])
    renderComRotas(<CategoriasPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Nova categoria' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))
    expect(within(dialogo).getByLabelText(/^Nome/)).toHaveAccessibleDescription('Dê um nome à categoria, ex.: Mercado.')
    expect(chamadas(fetchMock, 'POST', '/api/categorias/')).toHaveLength(0)
  })

  it('exibe o erro de validação da API no campo', async () => {
    rotas([mercado], [{ metodo: 'POST', caminho: '/api/categorias/', status: 400, corpo: { nome: ['Já existe uma categoria com esse nome.'] } }])
    renderComRotas(<CategoriasPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Nova categoria' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), 'mercado')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))
    expect(await within(dialogo).findByText('Já existe uma categoria com esse nome.')).toBeInTheDocument()
    expect(within(dialogo).getByLabelText(/^Nome/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('bloqueia o tipo de categoria com transações, com explicação', async () => {
    rotas([mercado])
    renderComRotas(<CategoriasPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Editar categoria Mercado' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Editar categoria' })
    within(dialogo).getAllByRole('radio', { name: /Receita|Despesa/ }).forEach((r) => expect(r).toBeDisabled())
    expect(within(dialogo).getByText(/Esta categoria já tem 4 transações/)).toBeInTheDocument()
    expect(within(dialogo).getByRole('radio', { name: 'Laranja' })).toBeChecked()
  })

  it('mantém uma cor fora da paleta ao editar', async () => {
    const fetchMock = rotas([viagem], [{ metodo: 'PUT', caminho: '/api/categorias/9/', corpo: viagem }])
    renderComRotas(<CategoriasPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Editar categoria Viagem' }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByText(/personalizada/)).toBeInTheDocument()
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))
    await vi.waitFor(() => expect(chamadas(fetchMock, 'PUT', '/api/categorias/9/')).toHaveLength(1))
    const [[, init]] = chamadas(fetchMock, 'PUT', '/api/categorias/9/')
    expect(JSON.parse(String(init?.body)).cor).toBe('#123456')
  })

  it('exclusão de categoria em uso abre diálogo informativo, sem excluir', async () => {
    const fetchMock = rotas([mercado])
    renderComRotas(<CategoriasPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir categoria Mercado' }))
    const dialogo = await screen.findByRole('alertdialog', { name: 'Não dá para excluir “Mercado” ainda' })
    expect(dialogo).toHaveTextContent('Esta categoria tem 4 transações. Mova ou exclua as transações antes.')
    expect(within(dialogo).queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument()
    expect(within(dialogo).getByRole('link', { name: 'Ver transações' })).toHaveAttribute('href', '/transacoes?mes=2026-11&categoria=3')
    expect(personagensNaTela()).toEqual(['papo-preocupado'])
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Entendi' }))
    expect(chamadas(fetchMock, 'DELETE', '/api/categorias/3/')).toHaveLength(0)
  })

  it('exclui categoria livre após confirmação', async () => {
    const fetchMock = rotas([salario], [{ metodo: 'DELETE', caminho: '/api/categorias/1/', status: 204 }])
    renderComRotas(<CategoriasPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir categoria Salário' }))
    const dialogo = await screen.findByRole('alertdialog', { name: 'Excluir “Salário”?' })
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Excluir categoria' }))
    await vi.waitFor(() => expect(chamadas(fetchMock, 'DELETE', '/api/categorias/1/')).toHaveLength(1))
  })

  it('se o backend recusar com 409, mostra o bloqueio com o número de transações', async () => {
    rotas([salario], [{ metodo: 'DELETE', caminho: '/api/categorias/1/', status: 409, corpo: { detail: 'Esta categoria tem transações e não pode ser excluída.', transacoes: 2 } }])
    renderComRotas(<CategoriasPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir categoria Salário' }))
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Excluir categoria' }))
    expect(await screen.findByRole('alertdialog', { name: 'Não dá para excluir “Salário” ainda' })).toHaveTextContent(
      'Esta categoria tem 2 transações.',
    )
  })
})
