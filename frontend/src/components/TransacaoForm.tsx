import { useState, type FormEvent } from 'react'
import { ApiError, type FieldErrors } from '@/api/client'
import type { Categoria, Transacao, TransacaoInput } from '@/api/types'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { hojeISO, parseValorBR, valorParaInput } from '@/lib/format'

interface TransacaoFormProps {
  transacao?: Transacao
  categorias: Categoria[]
  onSalvar: (dados: TransacaoInput) => void
  onCancelar: () => void
  salvando: boolean
  erro: unknown
}

export function TransacaoForm({ transacao, categorias, onSalvar, onCancelar, salvando, erro }: TransacaoFormProps) {
  const [descricao, setDescricao] = useState(transacao?.descricao ?? '')
  const [valor, setValor] = useState(transacao ? valorParaInput(transacao.valor) : '')
  const [data, setData] = useState(transacao?.data ?? hojeISO())
  const [categoria, setCategoria] = useState(transacao ? String(transacao.categoria) : '')
  const [observacao, setObservacao] = useState(transacao?.observacao ?? '')
  const [errosLocais, setErrosLocais] = useState<FieldErrors>({})

  const errosApi = erro instanceof ApiError ? erro.fieldErrors : {}
  const erroGeral = erro instanceof ApiError && Object.keys(errosApi).length === 0 ? erro.message : null
  const campos: FieldErrors = { ...errosApi, ...errosLocais }
  const invalido = (campo: string) => (campos[campo] ? true : undefined)

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    const valorApi = parseValorBR(valor)
    const novosErros: FieldErrors = {}
    if (!descricao.trim()) novosErros.descricao = ['Informe a descrição.']
    if (!valorApi) novosErros.valor = ['Informe um valor maior que zero, como 1.234,56.']
    if (!data) novosErros.data = ['Informe a data.']
    if (!categoria) novosErros.categoria = ['Escolha uma categoria.']
    setErrosLocais(novosErros)
    if (Object.keys(novosErros).length > 0 || !valorApi) return
    onSalvar({
      descricao: descricao.trim(),
      valor: valorApi,
      data,
      categoria: Number(categoria),
      observacao: observacao.trim(),
    })
  }

  const receitas = categorias.filter((c) => c.tipo === 'RECEITA')
  const despesas = categorias.filter((c) => c.tipo === 'DESPESA')

  return (
    <form className="grid gap-4" onSubmit={enviar} noValidate>
      <Field id="transacao-descricao" label="Descrição" erros={campos.descricao}>
        <Input
          id="transacao-descricao"
          value={descricao}
          maxLength={120}
          onChange={(e) => setDescricao(e.target.value)}
          aria-invalid={invalido('descricao')}
          autoFocus
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="transacao-valor" label="Valor (R$)" erros={campos.valor}>
          <Input
            id="transacao-valor"
            inputMode="decimal"
            placeholder="0,00"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            aria-invalid={invalido('valor')}
          />
        </Field>
        <Field id="transacao-data" label="Data" erros={campos.data}>
          <Input
            id="transacao-data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            aria-invalid={invalido('data')}
          />
        </Field>
      </div>
      <Field id="transacao-categoria" label="Categoria" erros={campos.categoria}>
        <NativeSelect
          id="transacao-categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          aria-invalid={invalido('categoria')}
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
        </NativeSelect>
      </Field>
      <Field id="transacao-observacao" label="Observação" erros={campos.observacao}>
        <Textarea
          id="transacao-observacao"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Opcional"
        />
      </Field>
      {erroGeral && (
        <p role="alert" className="text-sm text-destructive">
          {erroGeral}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" loading={salvando}>
          Salvar
        </Button>
      </DialogFooter>
    </form>
  )
}
