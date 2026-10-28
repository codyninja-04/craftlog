'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { postJson } from '@/lib/api'
import { formatMoney } from '@/lib/format'
import type { Material } from '@/lib/types'

// The project's bill of materials. Items logged with a session show up here
// too, so this is the one place the material total comes from.
export function MaterialsCostTracker({ projectId, materials, total, currency }: { projectId: string; materials: Material[]; total: number; currency: string }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [cost, setCost] = useState('')
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const sorted = [...materials].sort((a, b) => b.cost - a.cost)
  const shown = showAll ? sorted : sorted.slice(0, 6)
  const biggest = sorted[0]?.cost || 1

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await postJson('/api/materials', { project_id: projectId, name, quantity, cost })
      setName('')
      setQuantity('')
      setCost('')
      setAdding(false)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    setRemoving(id)
    try {
      await postJson(`/api/materials/${id}`, {}, 'DELETE')
      router.refresh()
    } finally {
      setRemoving(null)
    }
  }

  return (
    <section className="card p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="heading text-lg">Materials</h2>
        <span className="figure text-lg font-semibold">{formatMoney(total, currency)}</span>
      </div>

      {materials.length === 0 && !adding && <p className="mt-2 text-sm text-muted">Nothing logged yet. Add what you bought up front, or log materials with a session.</p>}

      {shown.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {shown.map((m) => (
            <li key={m.id} className={`group ${removing === m.id ? 'opacity-50' : ''}`}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-ink">
                  {m.name}
                  {m.quantity && <span className="text-faint"> · {m.quantity}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="figure text-muted">{formatMoney(m.cost, currency)}</span>
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    disabled={removing === m.id}
                    className="text-faint opacity-100 transition hover:text-danger sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                    aria-label={`Remove ${m.name}`}
                  >
                    ×
                  </button>
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-sunk">
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.max(2, (m.cost / biggest) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {sorted.length > 6 && (
        <button type="button" className="mt-3 text-xs font-semibold text-primary hover:underline" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show fewer' : `Show all ${sorted.length}`}
        </button>
      )}

      {adding ? (
        <form onSubmit={add} className="mt-4 space-y-2 border-t border-line pt-4">
          <input className="input" placeholder="What was it?" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required autoFocus aria-label="Material" />
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="Qty (optional)" value={quantity} onChange={(e) => setQuantity(e.target.value)} maxLength={40} aria-label="Quantity" />
            <input className="input figure" placeholder={`Cost (${currency})`} inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value.replace(/[^\d.]/g, ''))} aria-label="Cost" />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary py-2" disabled={saving || !name.trim()}>
              {saving ? 'Adding…' : 'Add'}
            </button>
            <button type="button" className="btn-quiet py-2" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn-ghost mt-4 w-full py-2" onClick={() => setAdding(true)}>
          + Add material
        </button>
      )}
    </section>
  )
}
