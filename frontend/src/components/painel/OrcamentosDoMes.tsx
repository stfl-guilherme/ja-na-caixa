// Seção "Orçamentos de [mês]" do Painel (spec 17.1).
import { Link } from 'react-router-dom'
import { BarraOrcamento } from '@/components/BarraOrcamento'
import { EstadoErro } from '@/components/Estados'
import { Skeleton } from '@/components/ui/skeleton'
import { useMesSelecionado } from '@/hooks/useMesSelecionado'
import { useOrcamentos } from '@/hooks/useOrcamentos'

export function OrcamentosDoMes({ mes }: { mes: string }) {
  const { comMes } = useMesSelecionado()
  const orcamentos = useOrcamentos(mes)

  if (orcamentos.isPending) return <Skeleton className="h-28 rounded-cartao bg-esqueleto-1" aria-label="Carregando" />
  if (orcamentos.error) return <EstadoErro erro={orcamentos.error} onTentarNovamente={() => orcamentos.refetch()} />

  return (
    <div className="rounded-cartao bg-branco px-[22px] py-5 shadow-cartao">
      {orcamentos.data.length === 0 ? (
        <p className="m-0 text-sm font-medium text-texto-2">
          Nenhuma categoria com limite.{' '}
          <Link to={comMes('/categorias')} className="font-bold text-verde-700">
            Defina limites em Categorias
          </Link>
        </p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-x-8 gap-y-5 p-0 largo:grid-cols-2">
          {orcamentos.data.map((orcamento) => (
            <li key={orcamento.categoria_id} className="min-w-0">
              <BarraOrcamento orcamento={orcamento} comNome />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
