import { BadInput, num, str } from './validate'

export interface MaterialInput {
  name: string
  quantity: string | null
  cost: number
}

// Parses the materials list sent with a log entry, or on its own. Blank rows
// from the form are skipped rather than rejected.
export function parseMaterials(v: unknown, max = 20): MaterialInput[] {
  if (v == null) return []
  if (!Array.isArray(v)) throw new BadInput('Materials should be a list')
  const out: MaterialInput[] = []
  for (const raw of v) {
    if (!raw || typeof raw !== 'object') continue
    const r = raw as Record<string, unknown>
    const name = str(r.name, 'Material name', { max: 120 })
    const cost = num(r.cost, 'Material cost', { min: 0, max: 1_000_000 })
    if (!name && cost == null) continue
    if (!name) throw new BadInput('Give each material a name')
    out.push({ name, quantity: str(r.quantity, 'Quantity', { max: 40 }), cost: round2(cost ?? 0) })
  }
  if (out.length > max) throw new BadInput(`Up to ${max} materials at a time`)
  return out
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}
