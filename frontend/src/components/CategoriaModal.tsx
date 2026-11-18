// Modal de categoria (docs/design/telas/app/categorias/Categorias.dc.html): tipo em rádios, 10 cores fixas.
import { ArrowDownLeft, ArrowUpRight, Check, Lock } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ApiError } from '@/api/client'
import type { Categoria, Tipo } from '@/api/types'
import { CampoFormulario } from '@/components/CampoFormulario'
import { botao } from '@/components/ui/botao'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSalvarCategoria } from '@/hooks/useCategorias'
import { ariaDoCampo, classeInputLimpo, molduraCampo } from '@/lib/campos'
import { nomeDaCor, PALETA } from '@/lib/paleta'
import { cn } from '@/lib/utils'

const ERRO_NOME = 'Dê um nome à categoria, ex.: Mercado.'

function plural(n: number) {
  return n === 1 ? '1 transação' : `${n} transações`
}

function Formulario({
  categoria,
  tipoInicial,
  onFechar,
  onSalva,
}: {
  categoria?: Categoria
  tipoInicial?: Tipo
  onFechar: () => void
  onSalva: (categoria: Categoria) => void
}) {
  const salvar = useSalvarCategoria()
  const [nome, setNome] = useState(categoria?.nome ?? '')
  const [tipo, setTipo] = useState<Tipo>(categoria?.tipo ?? tipoInicial ?? 'DESPESA')
  const [cor, setCor] = useState(categoria?.cor ?? PALETA[0].hex)
  const [tentou, setTentou] = useState(false)
  const bloqueado = (categoria?.transacoes ?? 0) > 0
  const api = salvar.error instanceof ApiError ? salvar.error : null
  const erroNome = (tentou && !nome.trim() ? ERRO_NOME : undefined) ?? api?.fieldErrors.nome?.[0]
  const erroGeral = api && !api.fieldErrors.nome ? (api.fieldErrors.tipo?.[0] ?? api.fieldErrors.cor?.[0] ?? api.message) : null

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    setTentou(true)
    if (!nome.trim()) return
    salvar.mutate({ id: categoria?.id, dados: { nome: nome.trim(), tipo, cor: cor.toUpperCase() } }, { onSuccess: onSalva })
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <CampoFormulario id="c-nome" rotulo="Nome" obrigatorio erro={erroNome}>
        <div className={molduraCampo(!!erroNome)}>
          <input
            id="c-nome"
            autoComplete="off"
            autoFocus
            maxLength={50}
            placeholder="Ex.: Mercado"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={classeInputLimpo}
            {...ariaDoCampo('c-nome', erroNome)}
          />
        </div>
      </CampoFormulario>

      <fieldset aria-describedby={bloqueado ? 'c-tipo-ajuda' : undefined} className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 flex items-center gap-1.5 p-0 text-sm font-semibold">
          Tipo <span aria-hidden="true">*</span>
          {bloqueado && (
            <span className="inline-flex items-center gap-1 font-semibold text-texto-2">
              <Lock className="size-4" strokeWidth={2.2} aria-hidden="true" /> bloqueado
            </span>
          )}
        </legend>
        <div className="grid grid-cols-2 gap-2.5">
          {(['RECEITA', 'DESPESA'] as const).map((opcao) => {
            const selecionado = tipo === opcao
            const Seta = opcao === 'RECEITA' ? ArrowDownLeft : ArrowUpRight
            return (
              <label
                key={opcao}
                className={cn(
                  'flex min-h-[52px] items-center gap-2.5 rounded-campo px-3.5 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-tinta',
                  selecionado ? 'border-2 border-tinta' : 'border-[1.5px] border-borda-botao',
                  bloqueado ? 'cursor-not-allowed bg-bloqueado-bg' : 'cursor-pointer bg-branco',
                  bloqueado && !selecionado && 'opacity-55',
                )}
              >
                <input
                  type="radio"
                  name="tipo"
                  value={opcao}
                  checked={selecionado}
                  disabled={bloqueado}
                  onChange={() => setTipo(opcao)}
                  className="m-0 size-5 accent-verde-700"
                />
                <span className={cn('flex items-center gap-1.5 text-[15px] font-bold', opcao === 'RECEITA' ? 'text-receita' : 'text-despesa-tx')}>
                  <Seta className="size-3.5" strokeWidth={2.6} aria-hidden="true" />
                  {opcao === 'RECEITA' ? 'Receita' : 'Despesa'}
                </span>
              </label>
            )
          })}
        </div>
        {bloqueado && categoria && (
          <p id="c-tipo-ajuda" className="m-0 flex gap-2 rounded-[10px] bg-bloqueado-bg px-3 py-2.5 text-[13px] leading-[1.45] font-medium text-texto-3">
            <Lock className="size-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
            <span>
              Esta categoria já tem {plural(categoria.transacoes)}. Para não bagunçar o histórico, o tipo não pode mudar. Você ainda pode trocar o nome
              e a cor.
            </span>
          </p>
        )}
      </fieldset>

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2.5 p-0 text-sm font-semibold">
          Cor <span aria-hidden="true">*</span> <span className="font-medium text-texto-2">· {nomeDaCor(cor)}</span>
        </legend>
        <div className="grid grid-cols-[repeat(5,44px)] gap-3">
          {PALETA.map(({ hex, nome: nomeCor }) => {
            const selecionada = cor.toLowerCase() === hex.toLowerCase()
            return (
              <label key={hex} title={nomeCor} className="group/cor relative block size-11 cursor-pointer">
                <input
                  type="radio"
                  name="cor"
                  value={hex}
                  checked={selecionada}
                  onChange={() => setCor(hex)}
                  aria-label={nomeCor}
                  className="peer absolute inset-0 m-0 size-11 cursor-pointer opacity-0"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-11 items-center justify-center rounded-full text-branco peer-focus-visible:shadow-[0_0_0_3px_#FFFFFF,0_0_0_5px_var(--jnc-cat-mostarda)]',
                    selecionada && 'shadow-[0_0_0_3px_#FFFFFF,0_0_0_5px_var(--jnc-tinta)]',
                  )}
                  style={{ background: hex }}
                >
                  {selecionada && <Check className="size-[18px]" strokeWidth={3} />}
                </span>
              </label>
            )
          })}
        </div>
        <p className="mt-2.5 mb-0 text-xs font-medium text-texto-2">Todas as cores têm contraste mínimo de 4,5:1 com texto branco.</p>
      </fieldset>

      <div className="flex items-center gap-3 rounded-campo bg-fundo-app px-3.5 py-3">
        <span className="text-[13px] font-semibold text-texto-2">Prévia</span>
        <span className="inline-flex items-center gap-2 text-[15px] font-bold">
          <span aria-hidden="true" className="size-3 rounded-full" style={{ background: cor }} />
          {nome.trim() || 'Nome da categoria'}
        </span>
      </div>

      {erroGeral && (
        <p role="alert" className="m-0 rounded-campo bg-erro-bg px-3.5 py-3 text-sm font-semibold text-erro-tx">
          {erroGeral}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2.5">
        <button type="button" onClick={onFechar} className={botao({ tipo: 'secundario' })}>
          Cancelar
        </button>
        <button type="submit" disabled={salvar.isPending} aria-busy={salvar.isPending} className={botao({ tipo: 'primario' })}>
          Salvar
        </button>
      </div>
    </form>
  )
}

interface CategoriaModalProps {
  aberto: boolean
  categoria?: Categoria
  /** Tipo já marcado ao criar (ex.: vindo do modal de transação). */
  tipoInicial?: Tipo
  onFechar: () => void
  onSalva: (categoria: Categoria) => void
}

export function CategoriaModal({ aberto, categoria, tipoInicial, onFechar, onSalva }: CategoriaModalProps) {
  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && onFechar()}>
      <DialogContent aria-describedby={undefined} className="max-w-[520px]">
        <DialogHeader className="mb-[18px]">
          <DialogTitle>{categoria ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
        </DialogHeader>
        {aberto && <Formulario key={categoria?.id ?? 'nova'} categoria={categoria} tipoInicial={tipoInicial} onFechar={onFechar} onSalva={onSalva} />}
      </DialogContent>
    </Dialog>
  )
}
