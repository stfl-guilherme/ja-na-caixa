import { ArrowDownCircle, ArrowUpCircle, Wallet, type LucideIcon } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { EstadoErro } from '@/components/Estados'
import { GraficoDespesas } from '@/components/GraficoDespesas'
import { SeletorMes } from '@/components/SeletorMes'
import { ValorTransacao } from '@/components/ValorTransacao'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useResumo } from '@/hooks/useResumo'
import { useTransacoes } from '@/hooks/useTransacoes'
import { formatarData, formatarMoeda, mesAtual } from '@/lib/format'
import { cn } from '@/lib/utils'

function CardTotal({
  titulo,
  valor,
  icone: Icone,
  cor,
}: {
  titulo: string
  valor: string | undefined
  icone: LucideIcon
  cor: string
}) {
  const id = useId()
  return (
    <Card role="region" aria-labelledby={id}>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle id={id} className="text-sm font-medium text-muted-foreground">
          {titulo}
        </CardTitle>
        <Icone className={cn('size-5', cor)} aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {valor === undefined ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <p className={cn('text-2xl font-semibold tabular-nums', cor)}>{formatarMoeda(valor)}</p>
        )}
      </CardContent>
    </Card>
  )
}

function Secao({ titulo, children, acao }: { titulo: string; children: React.ReactNode; acao?: React.ReactNode }) {
  const id = useId()
  return (
    <Card role="region" aria-labelledby={id}>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle id={id}>{titulo}</CardTitle>
        {acao}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [mes, setMes] = useState(mesAtual())
  const resumo = useResumo(mes)
  const ultimas = useTransacoes({ mes, page: 1 })

  const despesas = resumo.data?.por_categoria.filter((c) => c.tipo === 'DESPESA') ?? []
  const saldoNegativo = resumo.data?.saldo.startsWith('-') ?? false

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Resumo financeiro do mês.</p>
        </div>
        <SeletorMes mes={mes} onChange={setMes} />
      </div>

      {resumo.error ? (
        <EstadoErro erro={resumo.error} onTentarNovamente={() => resumo.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <CardTotal titulo="Receitas" valor={resumo.data?.receitas} icone={ArrowUpCircle} cor="text-receita" />
            <CardTotal titulo="Despesas" valor={resumo.data?.despesas} icone={ArrowDownCircle} cor="text-despesa" />
            <CardTotal
              titulo="Saldo"
              valor={resumo.data?.saldo}
              icone={Wallet}
              cor={saldoNegativo ? 'text-despesa' : 'text-foreground'}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Secao titulo="Despesas por categoria">
              {resumo.isPending ? (
                <Skeleton className="h-52" />
              ) : despesas.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma despesa neste mês.</p>
              ) : (
                <GraficoDespesas itens={despesas} />
              )}
            </Secao>

            <Secao
              titulo="Últimas transações"
              acao={
                <Link to="/transacoes" className="text-sm font-medium text-primary hover:underline">
                  Ver todas
                </Link>
              }
            >
              {ultimas.isPending ? (
                <div className="grid gap-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : ultimas.error ? (
                <EstadoErro erro={ultimas.error} onTentarNovamente={() => ultimas.refetch()} />
              ) : ultimas.data.results.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma transação neste mês.</p>
              ) : (
                <ul className="divide-y">
                  {ultimas.data.results.slice(0, 5).map((t) => (
                    <li key={t.id} className="flex items-center gap-3 py-2.5">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: t.categoria_cor }} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatarData(t.data)} · {t.categoria_nome}
                        </p>
                      </div>
                      <ValorTransacao valor={t.valor} tipo={t.tipo} className="text-sm" />
                    </li>
                  ))}
                </ul>
              )}
            </Secao>
          </div>
        </>
      )}
    </div>
  )
}
