'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { postJson } from '@/lib/api'
import { formatDate } from '@/lib/format'
import type { LogEntry } from '@/lib/types'
import { Lightbox } from './Lightbox'

// Every progress photo, oldest first, so you can watch the thing come together.
export function ProgressPhotoGrid({ projectId, entries, photos, coverPath }: { projectId: string; entries: LogEntry[]; photos: Record<string, string>; coverPath: string | null }) {
  const router = useRouter()
  const [open, setOpen] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const shots = entries
    .filter((e) => e.photo_url && photos[e.photo_url])
    .sort((a, b) => a.logged_at.localeCompare(b.logged_at))
    .map((e) => ({ path: e.photo_url!, url: photos[e.photo_url!], caption: e.entry_text ?? undefined, meta: formatDate(e.logged_at), milestone: e.is_milestone }))

  if (shots.length === 0) return null

  async function makeCover(path: string) {
    setSaving(true)
    try {
      await postJson(`/api/projects/${projectId}`, { cover_photo_url: path }, 'PATCH')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const current = open != null ? shots[open] : null

  return (
    <section className="card p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="heading text-lg">Progress photos</h2>
        <span className="figure text-xs text-faint">{shots.length}</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-1.5">
        {shots.map((s, i) => (
          <button key={s.path} type="button" onClick={() => setOpen(i)} className="group relative aspect-square overflow-hidden rounded-lg bg-sunk" aria-label={`Open photo from ${s.meta}`}>
            <img src={s.url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
            {s.milestone && <span className="absolute left-1 top-1 rounded bg-white/90 px-1 text-[0.6rem] font-bold text-primary-dark">★</span>}
            {s.path === coverPath && <span className="absolute bottom-1 left-1 rounded bg-ink/80 px-1.5 text-[0.6rem] font-semibold text-white">Cover</span>}
          </button>
        ))}
      </div>
      {open != null && current && (
        <Lightbox
          photos={shots}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          actions={
            current.path === coverPath ? (
              <span className="px-3 py-1.5 text-white/60">Cover photo</span>
            ) : (
              <button type="button" disabled={saving} onClick={() => makeCover(current.path)} className="rounded-lg px-3 py-1.5 font-semibold hover:bg-white/10 disabled:opacity-50">
                {saving ? 'Saving…' : 'Use as cover'}
              </button>
            )
          }
        />
      )}
    </section>
  )
}
