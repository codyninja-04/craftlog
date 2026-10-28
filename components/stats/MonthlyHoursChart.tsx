'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CRAFT_COLORS, CRAFT_LABELS } from '@/lib/crafts'
import { formatHours } from '@/lib/format'
import type { MonthBucket } from '@/lib/stats'
import type { CraftType } from '@/lib/types'

type Row = { key: string; label: string; total: number } & Partial<Record<CraftType, number>>

// Stacked bars, one colour per craft in the fixed craft order. Only the top
// segment of each stack gets rounded corners, and a 2px white stroke keeps a
// gap between segments.
export function MonthlyHoursChart({ months, crafts }: { months: MonthBucket[]; crafts: CraftType[] }) {
  const data: Row[] = months.map((m) => ({ key: m.key, label: m.label, total: m.total, ...m.hours }))

  const topOf = (row: Row): CraftType | undefined => {
    for (let i = crafts.length - 1; i >= 0; i--) if ((row[crafts[i]] ?? 0) > 0) return crafts[i]
    return undefined
  }

  return (
    <div>
      {crafts.length > 1 && (
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted" aria-label="Legend">
          {crafts.map((c) => (
            <li key={c} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CRAFT_COLORS[c] }} aria-hidden />
              {CRAFT_LABELS[c]}
            </li>
          ))}
        </ul>
      )}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke="#E7E5E4" />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#D6D3D1' }} tick={{ fill: '#78716C', fontSize: 11 }} interval={0} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#78716C', fontSize: 11 }} allowDecimals={false} unit="h" width={48} />
            <Tooltip cursor={{ fill: 'rgba(120, 113, 108, 0.08)' }} content={<HoursTooltip crafts={crafts} />} />
            {crafts.map((c) => (
              <Bar
                key={c}
                dataKey={c}
                stackId="h"
                fill={CRAFT_COLORS[c]}
                stroke="#FFFFFF"
                strokeWidth={2}
                isAnimationActive={false}
                shape={(props: unknown) => {
                  const { x, y, width, height, payload } = props as { x: number; y: number; width: number; height: number; payload: Row }
                  if (!height || height <= 0) return <g />
                  const r = topOf(payload) === c ? Math.min(4, width / 2, height) : 0
                  const path = r
                    ? `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`
                    : `M${x},${y} H${x + width} V${y + height} H${x} Z`
                  return <path d={path} fill={CRAFT_COLORS[c]} stroke="#FFFFFF" strokeWidth={2} />
                }}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function HoursTooltip({ active, payload, crafts }: { active?: boolean; payload?: { payload: Row }[]; crafts: CraftType[] }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  const [y, m] = row.key.split('-').map(Number)
  const month = new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const present = crafts.filter((c) => (row[c] ?? 0) > 0)
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lift">
      <p className="font-semibold text-ink">{month}</p>
      {present.length === 0 ? (
        <p className="mt-1 text-faint">Nothing logged</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {present
            .slice()
            .reverse()
            .map((c) => (
              <li key={c} className="flex items-center justify-between gap-4 text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: CRAFT_COLORS[c] }} />
                  {CRAFT_LABELS[c]}
                </span>
                <span className="figure text-ink">{formatHours(row[c] ?? 0)}</span>
              </li>
            ))}
          {present.length > 1 && (
            <li className="flex justify-between gap-4 border-t border-line pt-1 font-medium text-ink">
              <span>Total</span>
              <span className="figure">{formatHours(row.total)}</span>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
