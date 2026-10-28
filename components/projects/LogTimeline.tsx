'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { postJson } from '@/lib/api'
import { formatDateTime, formatHours, formatMoney } from '@/lib/format'
import type { LogEntry, Material } from '@/lib/types'
import { Lightbox } from './Lightbox'

export function LogTimeline({ entries, materials, photos, currency }: { entries: LogEntry[]; materials: Material[]; photos: Record<string, string>; currency: string }) {
  const [viewing, setViewing] = useState<string | null>(null)

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-strong px-6 py-10 text-center">
        <p className="font-medium text-ink">No entries yet</p>
        <p className="mt-1 text-sm text-muted">Log your first session above. Even &ldquo;cut the blanks, 40 minutes&rdquo; is worth writing down.</p>
      </div>
    )
  }

  const byEntry = new Map<string, Material[]>()
  for (const m of materials) {
    if (!m.log_entry_id) continue
    byEntry.set(m.log_entry_id, [...(byEntry.get(m.log_entry_id) ?? []), m])
  }

  // Sessions are numbered from the first one, but shown newest first.
  const total = entries.length
  const withPhotos = entries.filter((e) => e.photo_url && photos[e.photo_url])
  const viewerIndex = viewing ? withPhotos.findIndex((e) => e.id === viewing) : -1

  return (
    <>
      <ol className="relative space-y-4 before:absolute before:bottom-4 before:left-[0.95rem] before:top-4 before:w-px before:bg-line">
        {entries.map((entry, i) => (
          <EntryRow key={entry.id} entry={entry} number={total - i} materials={byEntry.get(entry.id) ?? []} photoUrl={entry.photo_url ? photos[entry.photo_url] : undefined} currency={currency} onPhoto={() => setViewing(entry.id)} />
        ))}
      </ol>
      {viewerIndex >= 0 && (
        <Lightbox
          photos={withPhotos.map((e) => ({ url: photos[e.photo_url!], caption: e.entry_text ?? undefined, meta: formatDateTime(e.logged_at) }))}
          index={viewerIndex}
          onIndex={(i) => setViewing(withPhotos[i].id)}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  )
}

function EntryRow({ entry, number, materials, photoUrl, currency, onPhoto }: { entry: LogEntry; number: number; materials: Material[]; photoUrl?: string; currency: string; onPhoto: () => void }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function toggleMilestone() {
    setBusy(true)
    try {
      await postJson(`/api/log-entries/${entry.id}`, { is_milestone: !entry.is_milestone }, 'PATCH')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      await postJson(`/api/log-entries/${entry.id}`, {}, 'DELETE')
      router.refresh()
    } catch {
      setBusy(false)
    }
  }

  return (
    <li className={`relative pl-11 ${busy ? 'opacity-60' : ''}`}>
      <span
        className={`absolute left-0 top-3 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
          entry.is_milestone ? 'border-primary bg-primary text-white' : 'border-line bg-surface text-faint'
        }`}
        aria-hidden
      >
        {entry.is_milestone ? '★' : <span className="figure">{number}</span>}
      </span>
      <article className={`card p-4 ${entry.is_milestone ? 'border-primary/30' : ''}`}>
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <time className="figure text-xs text-faint" dateTime={entry.logged_at}>
            {formatDateTime(entry.logged_at)}
          </time>
          {entry.is_milestone && <span className="label text-primary">Milestone</span>}
          <div className="ml-auto flex items-center gap-1.5">
            {(entry.time_spent_hours ?? 0) > 0 && <span className="chip figure py-0.5">{formatHours(entry.time_spent_hours!)}</span>}
            {entry.material_cost > 0 && <span className="chip figure py-0.5">{formatMoney(entry.material_cost, currency)}</span>}
          </div>
        </header>

        <div className={`mt-3 ${photoUrl ? 'grid gap-4 sm:grid-cols-[1fr_9rem]' : ''}`}>
          {entry.entry_text ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/90">{entry.entry_text}</p> : !photoUrl && <p className="text-sm italic text-faint">No notes</p>}
          {photoUrl && (
            <button type="button" onClick={onPhoto} className={`group overflow-hidden rounded-xl bg-sunk ${entry.entry_text ? 'aspect-square sm:order-last' : 'aspect-[4/3] sm:col-span-2'}`} aria-label="Open photo">
              <img src={photoUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
            </button>
          )}
        </div>

        {materials.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
            {materials.map((m) => (
              <li key={m.id} className="flex justify-between gap-3 text-muted">
                <span className="truncate">
                  {m.name}
                  {m.quantity && <span className="text-faint"> · {m.quantity}</span>}
                </span>
                <span className="figure shrink-0">{formatMoney(m.cost, currency)}</span>
              </li>
            ))}
          </ul>
        )}

        <footer className="mt-3 flex items-center gap-1 border-t border-line pt-2 text-xs">
          <button type="button" className="btn-quiet px-2 py-1 text-xs" onClick={toggleMilestone} disabled={busy}>
            {entry.is_milestone ? 'Unmark milestone' : 'Mark as milestone'}
          </button>
          {confirming ? (
            <span className="ml-auto flex items-center gap-1">
              <span className="text-faint">Delete this entry{materials.length ? ' and its materials' : ''}?</span>
              <button type="button" className="btn-quiet px-2 py-1 text-xs" onClick={() => setConfirming(false)}>
                Keep
              </button>
              <button type="button" className="btn px-2 py-1 text-xs text-danger hover:bg-danger-soft" onClick={remove} disabled={busy}>
                Delete
              </button>
            </span>
          ) : (
            <button type="button" className="btn-quiet ml-auto px-2 py-1 text-xs hover:text-danger" onClick={() => setConfirming(true)}>
              Delete
            </button>
          )}
        </footer>
      </article>
    </li>
  )
}
