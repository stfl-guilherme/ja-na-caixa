// Modal de nova/editar transação (docs/design/telas/app/transacoes/Transacoes.dc.html).
import { ArrowDownLeft, ArrowUpRight, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ApiError } from '@/api/client'
import type { Categoria, Transacao, TransacaoInput } from '@/api/types'
import { CampoFormulario } from '@/components/CampoFormulario'
import { ariaDoCampo, classeInputLimpo, molduraCampo } from '@/lib/campos'
import { MENSAGENS } from '@/lib/mensagens'
import { botao } from '@/components/ui/botao'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCategorias } from '@/hooks/useCategorias'
import { useSalvarTransacao } from '@/hooks/useTransacoes'
import { hojeISO } from '@/lib/format'
import {
  apiParaCentavos,
  centavosDeDigitos,
  centavosParaApi,
  dataBRParaISO,
  formatarCentavos,
  isoParaDataBR,
  mascararData,
} from '@/lib/mascaras'
import { cn } from '@/lib/utils'

interface Formulario {
  descricao: string
  centavos: number
  data: string
  categoria: string
  observacao: string
}

type Campo = 'descricao' | 'valor' | 'data' | 'categoria' | 'observacao'
type Erros = Partial<Record<Campo, string>>

function validar(f: Formulario): Erros {
  const erros: Erros = {}
  if (!f.descricao.trim()) erros.descricao = MENSAGENS.descricao
  if (!(f.centavos > 0)) erros.valor = MENSAGENS.valor
  if (!dataBRParaISO(f.data)) erros.data = MENSAGENS.data
  if (!f.categoria) erros.categoria = MENSAGENS.categoria
  return erros
}

/** Primeiro erro de cada campo devolvido pela API (formato do DRF). */
function errosDaApi(erro: unknown): Erros {
  if (!(erro instanceof ApiError)) return {}
  const campos: Campo[] = ['descricao', 'valor', 'data', 'categoria', 'observacao']
  return Object.fromEntries(campos.map((c) => [c, erro.fieldErrors[c]?.[0]]).filter(([, msg]) => msg))
}

function SeloTipo({ categoria }: { categoria?: Categoria }) {
  const tipo = categoria?.tipo
  return (
    <span
      id="m-tipo"
      className={cn(
        'inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold',
        tipo === 'RECEITA' && 'bg-verde-ativo-bg text-receita',
        tipo === 'DESPESA' && 'bg-despesa-bg text-despesa-tx',
        !tipo && 'bg-selo-bg text-texto-2',
      )}
    >
      {tipo === 'RECEITA' && <ArrowDownLeft className="size-3.5" strokeWidth={2.6} aria-hidden="true" />}
      {tipo === 'DESPESA' && <ArrowUpRight className="size-3.5" strokeWidth={2.6} aria-hidden="true" />}
      <span>{tipo === 'RECEITA' ? 'Receita: entra no saldo' : tipo === 'DESPESA' ? 'Despesa: sai do saldo' : 'Tipo vem da categoria'}</span>
    </span>
  )
}

interface FormularioTransacaoProps {
  transacao?: Transacao
  categorias: Categoria[]
  salvando: boolean
  erroApi: unknown
  onSalvar: (dados: TransacaoInput) => void
  onCancelar: () => void
  onExcluir?: () => void
}

export function FormularioTransacao({ transacao, categorias, salvando, erroApi, onSalvar, onCancelar, onExcluir }: FormularioTransacaoProps) {
  const [f, setF] = useState<Formulario>(() => ({
    descricao: transacao?.descricao ?? '',
    centavos: transacao ? apiParaCentavos(transacao.valor) : 0,
    data: isoParaDataBR(transacao?.data ?? hojeISO()),
    categoria: transacao ? String(transacao.categoria) : '',
    observacao: transacao?.observacao ?? '',
  }))
  const [tentou, setTentou] = useState(false)

  // Erros locais (após a primeira tentativa) têm prioridade sobre os da API.
  const erros: Erros = { ...errosDaApi(erroApi), ...(tentou ? validar(f) : {}) }
  const erroGeral = erroApi instanceof ApiError && Object.keys(erroApi.fieldErrors).length === 0 ? erroApi.message : null
  const atualizar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => setF((atual) => ({ ...atual, [campo]: valor }))

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    setTentou(true)
    const iso = dataBRParaISO(f.data)
    if (Object.keys(validar(f)).length > 0 || !iso) return
    onSalvar({
      descricao: f.descricao.trim(),
      valor: centavosParaApi(f.centavos),
      data: iso,
      categoria: Number(f.categoria),
      observacao: f.observacao.trim(),
    })
  }

  const receitas = categorias.filter((c) => c.tipo === 'RECEITA')
  const despesas = categorias.filter((c) => c.tipo === 'DESPESA')
  const escolhida = categorias.find((c) => String(c.id) === f.categoria)

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <CampoFormulario id="m-desc" rotulo="Descrição" obrigatorio erro={erros.descricao}>
        <div className={molduraCampo(!!erros.descricao)}>
          <input
            id="m-desc"
            autoComplete="off"
            autoFocus
            maxLength={120}
            placeholder="Ex.: Mercado do mês"
            value={f.descricao}
            onChange={(e) => atualizar('descricao', e.target.value)}
            className={classeInputLimpo}
            {...ariaDoCampo('m-desc', erros.descricao)}
          />
        </div>
      </CampoFormulario>

      <div className="grid grid-cols-1 gap-4 largo:grid-cols-2">
        <CampoFormulario id="m-valor" rotulo="Valor" obrigatorio erro={erros.valor}>
          <div className={cn(molduraCampo(!!erros.valor), erros.valor && 'bg-erro-campo-bg')}>
            <span aria-hidden="true" className="text-[15px] font-bold text-texto-2">
              R$
            </span>
            <input
              id="m-valor"
              inputMode="numeric"
              autoComplete="off"
              value={formatarCentavos(f.centavos)}
              onChange={(e) => atualizar('centavos', centavosDeDigitos(e.target.value))}
              className={cn(classeInputLimpo, 'text-right font-bold')}
              {...ariaDoCampo('m-valor', erros.valor)}
            />
          </div>
        </CampoFormulario>
        <CampoFormulario id="m-data" rotulo="Data" obrigatorio erro={erros.data}>
          <div className={molduraCampo(!!erros.data)}>
            <input
              id="m-data"
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              maxLength={10}
              value={f.data}
              onChange={(e) => atualizar('data', mascararData(e.target.value))}
              className={classeInputLimpo}
              {...ariaDoCampo('m-data', erros.data)}
            />
          </div>
        </CampoFormulario>
      </div>

      <CampoFormulario id="m-cat" rotulo="Categoria" obrigatorio erro={erros.categoria}>
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            id="m-cat"
            value={f.categoria}
            onChange={(e) => atualizar('categoria', e.target.value)}
            className={cn(
              'h-12 flex-[1_1_220px] cursor-pointer rounded-campo bg-branco px-3 text-base font-medium text-tinta',
              erros.categoria ? 'border-2 border-erro' : 'border-[1.5px] border-borda-campo',
            )}
            {...ariaDoCampo('m-cat', erros.categoria, 'm-tipo')}
          >
            <option value="">Selecione…</option>
            {receitas.length > 0 && (
              <optgroup label="Receitas">
                {receitas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </optgroup>
            )}
            {despesas.length > 0 && (
              <optgroup label="Despesas">
                {despesas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <SeloTipo categoria={escolhida} />
        </div>
      </CampoFormulario>

      <CampoFormulario
        id="m-obs"
        rotulo={
          <>
            Observação <span className="font-medium text-texto-2">(opcional)</span>
          </>
        }
        erro={erros.observacao}
      >
        <textarea
          id="m-obs"
          rows={3}
          value={f.observacao}
          onChange={(e) => atualizar('observacao', e.target.value)}
          placeholder="Algum detalhe para lembrar depois"
          className={cn(
            'resize-y rounded-campo p-3 text-base font-medium text-tinta',
            erros.observacao ? 'border-2 border-erro' : 'border-[1.5px] border-borda-campo',
          )}
          {...ariaDoCampo('m-obs', erros.observacao)}
        />
      </CampoFormulario>

      {erroGeral && (
        <p role="alert" className="m-0 rounded-campo bg-erro-bg px-3.5 py-3 text-sm font-semibold text-erro-tx">
          {erroGeral}
        </p>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-2.5">
        {onExcluir && (
          <button type="button" onClick={onExcluir} className={botao({ tipo: 'texto' })}>
            <Trash2 aria-hidden="true" />
            <span>Excluir</span>
          </button>
        )}
        <div className="flex-1" />
        <button type="button" onClick={onCancelar} className={botao({ tipo: 'secundario' })}>
          Cancelar
        </button>
        <button type="submit" disabled={salvando} aria-busy={salvando} className={botao({ tipo: 'primario' })}>
          Salvar
        </button>
      </div>
    </form>
  )
}

interface TransacaoModalProps {
  aberto: boolean
  transacao?: Transacao
  onFechar: () => void
  onSalvo: (editou: boolean) => void
  onPedirExcluir: (transacao: Transacao) => void
}

export function TransacaoModal({ aberto, transacao, onFechar, onSalvo, onPedirExcluir }: TransacaoModalProps) {
  const categorias = useCategorias()
  const salvar = useSalvarTransacao()

  return (
    <Dialog
      open={aberto}
      onOpenChange={(abrir) => {
        if (!abrir) onFechar()
      }}
    >
      <DialogContent aria-describedby="mt-ajuda">
        <DialogHeader className="mb-[18px]">
          <DialogTitle>{transacao ? 'Editar transação' : 'Nova transação'}</DialogTitle>
          <DialogDescription id="mt-ajuda">Campos com * são obrigatórios.</DialogDescription>
        </DialogHeader>
        {aberto && (
          <FormularioTransacao
            key={transacao?.id ?? 'nova'}
            transacao={transacao}
            categorias={categorias.data ?? []}
            salvando={salvar.isPending}
            erroApi={salvar.error}
            onCancelar={onFechar}
            onExcluir={transacao ? () => onPedirExcluir(transacao) : undefined}
            onSalvar={(dados) =>
              salvar.mutate(
                { id: transacao?.id, dados },
                {
                  onSuccess: () => {
                    salvar.reset()
                    onSalvo(!!transacao)
                  },
                },
              )
            }
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
