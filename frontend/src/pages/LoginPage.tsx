import { Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useLogin, useLoginDemo, useUsuario } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { mensagemDeErro } from '@/lib/erros'

export default function LoginPage() {
  const navigate = useNavigate()
  const { data: usuario } = useUsuario()
  const login = useLogin()
  const demo = useLoginDemo()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const entrar = (evento: FormEvent) => {
    evento.preventDefault()
    demo.reset()
    login.mutate({ username, password }, { onSuccess: () => navigate('/', { replace: true }) })
  }

  const entrarDemo = () => {
    login.reset()
    demo.mutate(undefined, { onSuccess: () => navigate('/', { replace: true }) })
  }

  const erro = login.error ?? demo.error
  const ocupado = login.isPending || demo.isPending

  if (usuario) return <Navigate to="/" replace />

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-background to-emerald-50 px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          {/* Espaço reservado para logo/mascote (fora do escopo da IA). */}
          <h1 className="text-3xl font-bold tracking-tight text-primary">JáNaCaixa</h1>
          <CardDescription>Seu controle financeiro pessoal</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="grid gap-4" onSubmit={entrar} noValidate>
            <Field id="username" label="Usuário">
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Field>
            <Field id="password" label="Senha">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            {erro && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {mensagemDeErro(erro)}
              </p>
            )}
            <Button type="submit" loading={login.isPending} disabled={ocupado}>
              Entrar
            </Button>
          </form>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" onClick={entrarDemo} loading={demo.isPending} disabled={ocupado}>
            {!demo.isPending && <Sparkles aria-hidden="true" />}
            Entrar como demonstração
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
