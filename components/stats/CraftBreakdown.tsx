import { CRAFT_COLORS, CRAFT_LABELS } from '@/lib/crafts'
import { formatHours, formatMoney } from '@/lib/format'
import type { CraftSummary } from '@/lib/stats'
import { CraftIcon } from '../projects/CraftIcon'

// A table first, with bars inside the cells. Time and cost each get their own
// column and scale, never a shared axis.
export function CraftBreakdown({ rows, currency }: { rows: CraftSummary[]; currency: string }) {
  const maxHours = Math.max(1, ...rows.map((r) => r.hours))
  const maxCost = Math.max(1, ...rows.map((r) => r.cost))

  return (
    <div className="-mx-5 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[34rem] text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="label px-5 pb-2 font-medium sm:pl-0">Craft</th>
            <th className="label pb-2 text-right font-medium">Projects</th>
            <th className="label w-[30%] pb-2 pl-6 font-medium">Time</th>
            <th className="label w-[30%] pb-2 pl-6 pr-5 font-medium sm:pr-0">Materials</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.craft} className="border-b border-line/70 last:border-0">
              <td className="px-5 py-3 sm:pl-0">
                <span className="inline-flex items-center gap-2 font-medium text-ink">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md text-white" style={{ background: CRAFT_COLORS[r.craft] }}>
                    <CraftIcon craft={r.craft} className="h-3.5 w-3.5" />
                  </span>
                  {CRAFT_LABELS[r.craft]}
                </span>
              </td>
              <td className="figure py-3 text-right text-muted">
                {r.projects}
                {r.completed > 0 && <span className="text-faint"> · {r.completed} done</span>}
              </td>
              <td className="py-3 pl-6">
                <Bar value={r.hours / maxHours} color={CRAFT_COLORS[r.craft]} label={formatHours(r.hours)} title={`${CRAFT_LABELS[r.craft]}: ${formatHours(r.hours)}`} />
              </td>
              <td className="py-3 pl-6 pr-5 sm:pr-0">
                <Bar value={r.cost / maxCost} color={CRAFT_COLORS[r.craft]} label={formatMoney(r.cost, currency)} title={`${CRAFT_LABELS[r.craft]}: ${formatMoney(r.cost, currency)}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Bar({ value, color, label, title }: { value: number; color: string; label: string; title: string }) {
  return (
    <div className="flex items-center gap-2" title={title}>
      <div className="h-2 flex-1 overflow-hidden rounded-r bg-sunk">
        <div className="h-full rounded-r" style={{ width: `${Math.max(value > 0 ? 3 : 0, value * 100)}%`, background: color }} />
      </div>
      <span className="figure w-16 shrink-0 text-right text-xs text-ink">{label}</span>
    </div>
  )
}
