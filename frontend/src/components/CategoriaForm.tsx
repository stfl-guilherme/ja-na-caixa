import { useState, type FormEvent } from 'react'
import { ApiError } from '@/api/client'
import type { Categoria, CategoriaInput, Tipo } from '@/api/types'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { ariaCampo } from '@/components/ui/aria-campo'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'

export const COR_PADRAO = '#64748B'

interface CategoriaFormProps {
  categoria?: Categoria
  onSalvar: (dados: CategoriaInput) => void
  onCancelar: () => void
  salvando: boolean
  erro: unknown
}

export function CategoriaForm({ categoria, onSalvar, onCancelar, salvando, erro }: CategoriaFormProps) {
  const [nome, setNome] = useState(categoria?.nome ?? '')
  const [tipo, setTipo] = useState<Tipo>(categoria?.tipo ?? 'DESPESA')
  const [cor, setCor] = useState(categoria?.cor ?? COR_PADRAO)
  const tipoBloqueado = (categoria?.transacoes ?? 0) > 0
  const campos = erro instanceof ApiError ? erro.fieldErrors : {}
  const erroGeral = erro instanceof ApiError && Object.keys(campos).length === 0 ? erro.message : null

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    onSalvar({ nome: nome.trim(), tipo, cor: cor.toUpperCase() })
  }

  return (
    <form className="grid gap-4" onSubmit={enviar} noValidate>
      <Field id="categoria-nome" label="Nome" erros={campos.nome}>
        <Input
          id="categoria-nome"
          value={nome}
          maxLength={50}
          onChange={(e) => setNome(e.target.value)}
          {...ariaCampo('categoria-nome', campos.nome)}
          autoFocus
        />
      </Field>
      <Field id="categoria-tipo" label="Tipo" erros={campos.tipo}>
        <NativeSelect
          id="categoria-tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as Tipo)}
          disabled={tipoBloqueado}
          {...ariaCampo('categoria-tipo', campos.tipo)}
        >
          <option value="DESPESA">Despesa</option>
          <option value="RECEITA">Receita</option>
        </NativeSelect>
        {tipoBloqueado && (
          <p className="text-xs text-muted-foreground">
            O tipo não pode mudar porque a categoria já tem transações.
          </p>
        )}
      </Field>
      <Field id="categoria-cor" label="Cor" erros={campos.cor}>
        <div className="flex items-center gap-3">
          <input
            type="color"
            aria-label="Escolher cor"
            value={/^#[0-9A-Fa-f]{6}$/.test(cor) ? cor : COR_PADRAO}
            onChange={(e) => setCor(e.target.value.toUpperCase())}
            className="h-10 w-14 cursor-pointer rounded-md border border-input bg-card p-1"
          />
          <Input
            id="categoria-cor"
            value={cor}
            maxLength={7}
            onChange={(e) => setCor(e.target.value)}
            {...ariaCampo('categoria-cor', campos.cor)}
            className="font-mono uppercase"
          />
        </div>
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
