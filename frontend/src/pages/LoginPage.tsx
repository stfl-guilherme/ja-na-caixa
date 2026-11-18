// Login (docs/design/telas/login/): cena de praia + cartão no desktop; cena no topo sobre areia no celular.
import { Navigate, useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { useLogin, useLoginDemo, useUsuario } from '@/auth/useAuth'
import { CenaPraia, CenaPraiaMobile } from '@/components/login/CenaPraia'
import { LoginForm, type EstadoLogin } from '@/components/login/LoginForm'
import { useTelaLarga } from '@/hooks/useTelaLarga'
import { mensagemDeErro } from '@/lib/erros'
import type { Pose } from '@/lib/personagens'

const CENA: Record<EstadoLogin, { pose: Pose; fala: string }> = {
  padrao: { pose: 'papo-cadeira-acenando', fala: 'Bom dia! O mar tá calmo, pode entrar.' },
  carregando: { pose: 'papo-animado', fala: 'Abrindo a caixa…' },
  erro: { pose: 'papo-preocupado', fala: 'Hmm… não achei essa conta.' },
}

function descreverErro(erro: unknown) {
  if (erro instanceof ApiError && erro.status === 400) {
    return { titulo: 'Usuário ou senha inválidos', detalhe: 'Confira os dados e tente de novo.' }
  }
  return { titulo: 'Não foi possível entrar', detalhe: mensagemDeErro(erro) }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const larga = useTelaLarga()
  const { data: usuario } = useUsuario()
  const login = useLogin()
  const demo = useLoginDemo()

  if (usuario) return <Navigate to="/" replace />

  const erro = login.error ?? demo.error
  const estado: EstadoLogin = login.isPending || demo.isPending ? 'carregando' : erro ? 'erro' : 'padrao'
  const irParaPainel = () => navigate('/', { replace: true })

  const formulario = (
    <LoginForm
      estado={estado}
      erro={estado === 'erro' ? descreverErro(erro) : null}
      superficie={larga ? 'branco' : 'areia'}
      onEntrar={(username, password) => {
        demo.reset()
        login.mutate({ username, password }, { onSuccess: irParaPainel })
      }}
      onDemo={(modo) => {
        login.reset()
        demo.mutate(modo, { onSuccess: irParaPainel })
      }}
      modoCarregando={demo.isPending ? demo.variables : null}
    />
  )
  const rodape = <footer className="text-[13px] font-medium text-texto-2">Projeto acadêmico — AMF</footer>

  if (larga) {
    return (
      <main className="relative flex min-h-[max(100vh,760px)] items-center justify-end overflow-hidden bg-ceu px-[clamp(16px,6vw,96px)] py-8">
        <CenaPraia {...CENA[estado]} />
        <div className="relative flex w-full max-w-[440px] flex-col items-center gap-6 rounded-cartao bg-branco px-8 pt-9 pb-6 shadow-[0_24px_60px_rgba(20,32,40,0.18)]">
          {formulario}
          {rodape}
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-areia bg-[radial-gradient(circle,rgba(150,110,50,0.14)_0.9px,transparent_1.4px),radial-gradient(circle,rgba(255,255,255,0.35)_0.9px,transparent_1.4px)] [background-position:0_0,9px_13px] [background-size:18px_18px,27px_27px]">
      <CenaPraiaMobile {...CENA[estado]} />
      <div className="flex flex-col items-center gap-6 px-5 pt-3 pb-8">
        <div className="w-full max-w-[440px]">{formulario}</div>
        {rodape}
      </div>
    </main>
  )
}
