import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { ResumoCategoria } from '@/api/types'
import { formatarMoeda } from '@/lib/format'

/**
 * Rosca de despesas por categoria. Os totais vêm prontos do backend (ADR-005);
 * a conversão para número serve só para o Recharts desenhar as fatias.
 */
export function GraficoDespesas({ itens }: { itens: ResumoCategoria[] }) {
  const dados = itens.map((item) => ({ ...item, valor: Number(item.total) }))
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,220px)_1fr]">
      <div className="mx-auto h-52 w-full max-w-[220px]" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={dados} dataKey="valor" nameKey="nome" innerRadius="58%" outerRadius="95%" paddingAngle={2} stroke="none">
              {dados.map((item) => (
                <Cell key={item.categoria_id} fill={item.cor} />
              ))}
            </Pie>
            <Tooltip formatter={(_valor, _nome, entrada) => formatarMoeda(entrada.payload.total)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid gap-2 text-sm">
        {itens.map((item) => (
          <li key={item.categoria_id} className="flex items-center gap-3">
            <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: item.cor }} aria-hidden="true" />
            <span className="flex-1 truncate">{item.nome}</span>
            <span className="font-medium tabular-nums">{formatarMoeda(item.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
