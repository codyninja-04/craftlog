'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { postJson } from '@/lib/api'
import { formatHours, parseDuration } from '@/lib/format'
import { PhotoPicker, type PickedPhoto } from './PhotoPicker'

const QUICK_TIMES = [0.25, 0.5, 1, 2, 3]

interface Row {
  key: number
  name: string
  quantity: string
  cost: string
}

let rowKey = 0
const blankRow = (): Row => ({ key: ++rowKey, name: '', quantity: '', cost: '' })

function nowLocal(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function LogEntryForm({ projectId, currency }: { projectId: string; currency: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState<PickedPhoto | null>(null)
  const [time, setTime] = useState('')
  const [milestone, setMilestone] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [when, setWhen] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hours = time.trim() ? parseDuration(time) : null
  const timeInvalid = time.trim() !== '' && (hours == null || hours > 24)
  const hasMaterials = rows.some((r) => r.name.trim() || r.cost.trim())
  const canSave = !saving && !uploading && !timeInvalid && (text.trim() || photo || (hours ?? 0) > 0 || hasMaterials)

  function reset() {
    setText('')
    setPhoto(null)
    setTime('')
    setMilestone(false)
    setRows([])
    setWhen(null)
    setError(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      await postJson('/api/log-entries', {
        project_id: projectId,
        entry_text: text,
        photo_url: photo?.path ?? null,
        time_spent_hours: hours,
        is_milestone: milestone,
        materials: rows.map((r) => ({ name: r.name, quantity: r.quantity, cost: r.cost })),
        ...(when ? { logged_at: new Date(when).toISOString() } : {}),
      })
      reset()
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="card flex w-full items-center gap-3 p-4 text-left transition hover:border-strong">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-light text-white">+</span>
        <span>
          <span className="block font-semibold text-ink">Log a session</span>
          <span className="block text-sm text-muted">What you did, a photo, the time it took, anything you bought</span>
        </span>
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="card animate-rise-in space-y-5 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="heading text-lg">New log entry</h3>
        <button type="button" className="btn-quiet px-2 py-1 text-xs" onClick={() => (reset(), setOpen(false))}>
          Cancel
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
        <div>
          <label htmlFor="entry" className="sr-only">
            What did you do?
          </label>
          <textarea
            id="entry"
            rows={5}
            className="input h-full min-h-32 resize-y"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What did you get done? Anything that went wrong, settings you changed, what you'd do differently…"
            maxLength={4000}
            autoFocus
          />
        </div>
        <PhotoPicker projectId={projectId} value={photo} onChange={setPhoto} onBusy={setUploading} />
      </div>

      <div>
        <label htmlFor="time" className="field-label">
          Time spent
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="time"
            className={`input w-32 ${timeInvalid ? 'border-danger focus:border-danger' : ''}`}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="1h 30m"
            inputMode="text"
            aria-invalid={timeInvalid}
          />
          {QUICK_TIMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTime(formatHours(t))}
              className={`chip figure hover:border-strong ${hours === t ? 'border-ink bg-ink text-white' : ''}`}
            >
              {formatHours(t)}
            </button>
          ))}
        </div>
        <p className={`hint ${timeInvalid ? 'text-danger' : ''}`}>{timeInvalid ? 'Try 1.5, 1:30 or 1h 30m, up to 24 hours.' : 'Decimals, 1:30 or 1h 30m all work.'}</p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="field-label mb-0">Materials bought for this session</span>
          <button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={() => setRows((r) => [...r, blankRow()])}>
            + Add material
          </button>
        </div>
        {rows.length > 0 && (
          <div className="mt-2 space-y-2">
            {rows.map((row) => (
              <div key={row.key} className="grid grid-cols-[1fr_5.5rem_6rem_auto] gap-2">
                <input
                  className="input"
                  placeholder="PLA filament, 1kg"
                  aria-label="Material"
                  value={row.name}
                  onChange={(e) => setRows((rs) => rs.map((r) => (r.key === row.key ? { ...r, name: e.target.value } : r)))}
                />
                <input
                  className="input"
                  placeholder="Qty"
                  aria-label="Quantity"
                  value={row.quantity}
                  onChange={(e) => setRows((rs) => rs.map((r) => (r.key === row.key ? { ...r, quantity: e.target.value } : r)))}
                />
                <input
                  className="input figure"
                  placeholder={currency}
                  aria-label={`Cost in ${currency}`}
                  inputMode="decimal"
                  value={row.cost}
                  onChange={(e) => setRows((rs) => rs.map((r) => (r.key === row.key ? { ...r, cost: e.target.value.replace(/[^\d.]/g, '') } : r)))}
                />
                <button type="button" className="btn-quiet px-2" aria-label="Remove material" onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={milestone} onChange={(e) => setMilestone(e.target.checked)} className="h-4 w-4 rounded border-strong accent-primary" />
            Milestone
          </label>
          {when == null ? (
            <button type="button" className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline" onClick={() => setWhen(nowLocal())}>
              This was earlier
            </button>
          ) : (
            <input type="datetime-local" className="input w-auto py-1.5" value={when} max={nowLocal()} onChange={(e) => setWhen(e.target.value)} aria-label="When this happened" />
          )}
        </div>
        <button type="submit" className="btn-primary" disabled={!canSave}>
          {saving ? 'Saving…' : uploading ? 'Waiting for photo…' : 'Save entry'}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  )
}
