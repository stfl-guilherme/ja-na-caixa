// Formulário do login (docs/design/telas/componentes/Form.dc.html).
import { AlertCircle, ArrowLeft, ChevronRight, Eye, EyeOff, Lock, Play, Sparkles, Sprout, User } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { ModoDemo } from '@/api/types'
import { Logo } from '@/components/Logo'
import { Spinner } from '@/components/Spinner'
import { cn } from '@/lib/utils'

export type EstadoLogin = 'padrao' | 'carregando' | 'erro'

interface LoginFormProps {
  estado: EstadoLogin
  /** Mensagem do erro; credenciais inválidas usam o texto do design. */
  erro: { titulo: string; detalhe: string } | null
  superficie: 'branco' | 'areia'
  onEntrar: (username: string, password: string) => void
  onDemo: (modo: ModoDemo) => void
  /** Modo de demonstração que está entrando (mostra carregando na opção). */
  modoCarregando?: ModoDemo | null
}

const OPCOES_DEMO: { modo: ModoDemo; titulo: string; descricao: string; Icone: typeof Sparkles }[] = [
  {
    modo: 'exemplo',
    titulo: 'Ver com dados de exemplo',
    // O seed gera 12 meses (spec 7); o texto não promete "três meses" (spec 16).
    descricao: 'Um ano de receitas e despesas para explorar o painel.',
    Icone: Sparkles,
  },
  { modo: 'vazio', titulo: 'Começar do zero', descricao: 'Uma conta vazia para lançar suas primeiras transações.', Icone: Sprout },
]

/** Escolha do modo de demonstração, expandida no próprio cartão do login (ADR-018). */
function EscolhaDemo({
  carregando,
  modoCarregando,
  onEscolher,
  onVoltar,
}: {
  carregando: boolean
  modoCarregando?: ModoDemo | null
  onEscolher: (modo: ModoDemo) => void
  onVoltar: () => void
}) {
  const primeira = useRef<HTMLButtonElement>(null)
  useEffect(() => primeira.current?.focus(), [])

  return (
    <div role="group" aria-labelledby="titulo-escolha-demo" className="flex flex-col gap-3">
      <p id="titulo-escolha-demo" className="m-0 text-[15px] font-bold">
        Como você quer entrar na demonstração?
      </p>
      <div className="grid grid-cols-1 gap-3">
        {OPCOES_DEMO.map(({ modo, titulo, descricao, Icone }, i) => {
          const principal = i === 0
          const esta = modoCarregando === modo
          return (
            <button
              key={modo}
              ref={principal ? primeira : undefined}
              type="button"
              onClick={() => !carregando && onEscolher(modo)}
              disabled={carregando && !esta}
              aria-busy={esta}
              className={cn(
                'flex min-h-[76px] items-center gap-3.5 rounded-demo py-3 pr-4 pl-3 text-left text-tinta disabled:opacity-55',
                principal
                  ? 'border-[2.5px] border-tinta bg-amarelo-papo shadow-cartum'
                  : 'border-[1.5px] border-borda-botao bg-branco hover:bg-fundo-app',
                carregando ? 'cursor-progress' : 'cursor-pointer',
                principal && !carregando && 'active:translate-y-0.5 active:shadow-[0_2px_0_var(--jnc-tinta)]',
              )}
            >
              <span
                aria-hidden="true"
                className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', principal ? 'bg-tinta text-amarelo-papo' : 'bg-verde-ativo-bg text-verde-ativo-tx')}
              >
                {esta ? <Spinner /> : <Icone className="size-5" />}
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-base leading-tight font-extrabold">{titulo}</span>
                <span className={cn('text-[13px] leading-[1.35] font-semibold', principal ? 'text-demo-tx' : 'text-texto-2')}>
                  {esta ? 'Entrando…' : descricao}
                </span>
              </span>
              {!esta && <ChevronRight className="size-5 shrink-0" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
      <p className="m-0 text-xs font-medium text-texto-2">Os dados de demonstração são recriados a cada entrada.</p>
      <button
        type="button"
        onClick={onVoltar}
        disabled={carregando}
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 self-start rounded-[10px] border-0 bg-transparent px-2 text-sm font-semibold text-tinta hover:bg-fundo-app disabled:opacity-55"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar
      </button>
    </div>
  )
}

function Campo({
  id,
  rotulo,
  icone,
  erro,
  carregando,
  areia,
  children,
}: {
  id: string
  rotulo: string
  icone: ReactNode
  erro: boolean
  carregando: boolean
  areia: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {rotulo}
      </label>
      <div
        className={cn(
          'flex h-12 items-center gap-2.5 rounded-campo pl-3.5 pr-1 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-tinta',
          erro ? 'border-2 border-erro bg-erro-campo-bg' : areia ? 'border-[1.5px] border-borda-areia' : 'border-[1.5px] border-borda-campo',
          !erro && (carregando ? 'bg-bloqueado-bg' : 'bg-branco'),
        )}
      >
        <span aria-hidden="true" className="flex text-texto-2">
          {icone}
        </span>
        {children}
      </div>
    </div>
  )
}

const classeInput =
  'h-full min-w-0 flex-1 border-0 bg-transparent text-base font-medium text-tinta outline-none placeholder:text-texto-2/80 disabled:cursor-progress'

export function LoginForm({ estado, erro, superficie, onEntrar, onDemo, modoCarregando = null }: LoginFormProps) {
  const [escolhendo, setEscolhendo] = useState(false)
  const botaoDemo = useRef<HTMLButtonElement>(null)
  const devolverFoco = useRef(false)
  const voltar = () => {
    devolverFoco.current = true
    setEscolhendo(false)
  }
  // Devolve o foco ao botão que abriu a escolha assim que ele volta a existir.
  useEffect(() => {
    if (!escolhendo && devolverFoco.current) {
      devolverFoco.current = false
      botaoDemo.current?.focus()
    }
  }, [escolhendo])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const carregando = estado === 'carregando'
  const comErro = estado === 'erro'
  const areia = superficie === 'areia'
  const ariaErro = comErro ? { 'aria-invalid': true, 'aria-describedby': 'erro-login' } : {}

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    if (!carregando) onEntrar(username, password)
  }

  return (
    <form onSubmit={enviar} noValidate className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Logo className="text-4xl" />
        <p className="m-0 text-[15px] leading-[1.4] font-medium text-texto-2">Cada centavo no seu lugar.</p>
      </div>
      <h1 className="mt-2 mb-0 text-2xl leading-tight font-bold tracking-[-0.2px]">Entre na sua conta</h1>

      {erro && (
        <div
          id="erro-login"
          role="alert"
          className="flex items-start gap-2.5 rounded-campo border border-erro-borda bg-erro-bg px-3.5 py-3 text-erro-tx"
        >
          <AlertCircle className="mt-px size-5 shrink-0 text-erro" aria-hidden="true" />
          <div className="flex flex-col gap-0.5">
            <strong className="text-[15px] font-bold">{erro.titulo}</strong>
            <span className="text-sm font-medium">{erro.detalhe}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Campo id="jnc-usuario" rotulo="Usuário" icone={<User className="size-[18px]" />} erro={comErro} carregando={carregando} areia={areia}>
          <input
            id="jnc-usuario"
            name="usuario"
            autoComplete="username"
            placeholder="seu.usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={carregando}
            className={classeInput}
            {...ariaErro}
          />
        </Campo>
        <Campo id="jnc-senha" rotulo="Senha" icone={<Lock className="size-[18px]" />} erro={comErro} carregando={carregando} areia={areia}>
          <input
            id="jnc-senha"
            name="senha"
            type={mostrar ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={carregando}
            className={classeInput}
            {...ariaErro}
          />
          <button
            type="button"
            onClick={() => setMostrar((m) => !m)}
            aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={mostrar}
            className={cn(
              'flex min-w-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-transparent px-2.5 text-sm font-semibold text-tinta',
              areia ? 'h-11' : 'h-10',
            )}
          >
            {mostrar ? <EyeOff className="size-[18px]" aria-hidden="true" /> : <Eye className="size-[18px]" aria-hidden="true" />}
            <span aria-hidden="true">{mostrar ? 'Ocultar' : 'Mostrar'}</span>
          </button>
        </Campo>
      </div>

      <button
        type="submit"
        disabled={carregando}
        aria-busy={carregando}
        className={cn(
          'flex h-13 items-center justify-center gap-2.5 rounded-botao border-0 bg-verde-700 text-base font-bold text-branco',
          carregando ? 'cursor-progress' : 'cursor-pointer hover:brightness-110',
        )}
      >
        {carregando ? (
          <>
            <Spinner />
            <span>Entrando…</span>
          </>
        ) : (
          <span>Entrar</span>
        )}
      </button>

      <div className="flex items-center gap-3 text-[13px] font-semibold text-texto-2">
        <span aria-hidden="true" className={cn('h-px flex-1', areia ? 'bg-divisor-areia' : 'bg-divisor-claro')} />
        <span>ou</span>
        <span aria-hidden="true" className={cn('h-px flex-1', areia ? 'bg-divisor-areia' : 'bg-divisor-claro')} />
      </div>

      {escolhendo ? (
        <EscolhaDemo carregando={carregando} modoCarregando={modoCarregando} onEscolher={onDemo} onVoltar={voltar} />
      ) : (
        /* Único elemento com traço cartunesco na interface (decisoes-de-design, princípio 2). */
        <button
          ref={botaoDemo}
          type="button"
          onClick={() => !carregando && setEscolhendo(true)}
          disabled={carregando}
          className={cn(
            'flex min-h-17 items-center gap-3.5 rounded-demo border-[2.5px] border-tinta bg-amarelo-papo py-2.5 pr-4 pl-3 text-left text-tinta shadow-cartum',
            carregando ? 'cursor-progress opacity-55' : 'cursor-pointer active:translate-y-0.5 active:shadow-[0_2px_0_var(--jnc-tinta)]',
          )}
        >
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-tinta">
            <Play className="size-[18px] fill-amarelo-papo text-amarelo-papo" />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[17px] leading-tight font-extrabold">Entrar como demonstração</span>
            <span className="text-[13px] leading-[1.3] font-semibold text-demo-tx">Explore com dados de exemplo ou comece do zero</span>
          </span>
          <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
        </button>
      )}
    </form>
  )
}
