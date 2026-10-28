'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { postJson } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import type { Confidence, TroubleshootSession } from '@/lib/types'

const CONFIDENCE: Record<Confidence, { label: string; bars: number; note: string }> = {
  high: { label: 'High confidence', bars: 3, note: 'The photo and description point clearly at this.' },
  medium: { label: 'Medium confidence', bars: 2, note: 'Likely, but worth checking the causes in order.' },
  low: { label: 'Low confidence', bars: 1, note: 'A best guess. A clearer photo or more detail would help.' },
}

export function TroubleshootResult({ session, photoUrl, fresh = false, needsBetterPhoto = false }: { session: TroubleshootSession; photoUrl?: string; fresh?: boolean; needsBetterPhoto?: boolean }) {
  const router = useRouter()
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [note, setNote] = useState(session.resolution_note ?? '')
  const [closing, setClosing] = useState<null | 'yes' | 'no'>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const conf = CONFIDENCE[session.confidence ?? 'low']

  async function save(resolved: boolean) {
    setSaving(true)
    setError(null)
    try {
      await postJson(`/api/troubleshoot/${session.id}`, { resolved, resolution_note: note }, 'PATCH')
      setClosing(null)
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    setDeleting(true)
    try {
      await postJson(`/api/troubleshoot/${session.id}`, {}, 'DELETE')
      router.refresh()
    } catch {
      setDeleting(false)
    }
  }

  return (
    <article id={session.id} className={`card scroll-mt-24 overflow-hidden ${fresh ? 'animate-rise-in border-primary/30 shadow-lift' : ''} ${deleting ? 'opacity-50' : ''}`}>
      <div className={`grid ${photoUrl ? 'sm:grid-cols-[11rem_1fr]' : ''}`}>
        {photoUrl && (
          <div className="relative aspect-[4/3] bg-sunk sm:aspect-auto">
            <img src={photoUrl} alt="The problem" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        )}
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <time className="figure text-xs text-faint" dateTime={session.created_at}>
              {formatDateTime(session.created_at)}
            </time>
            {session.resolved ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-completed-soft px-2 py-0.5 text-xs font-semibold text-completed-ink">✓ Solved</span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-dark">Open</span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted">
            <span className="font-medium text-ink">You said:</span> {session.problem_description}
          </p>
        </div>
      </div>

      <div className="border-t border-line p-5 sm:p-6">
        {needsBetterPhoto && (
          <p className="mb-4 rounded-xl border border-primary/20 bg-primary-wash px-3 py-2 text-sm text-primary-dark">
            The photo didn&rsquo;t show the problem clearly. For a sharper read, try a close up in good light, with the problem area filling most of the frame.
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="label text-primary">Diagnosis</p>
          <div className="flex items-center gap-2" title={conf.note}>
            <span className="flex gap-0.5" aria-hidden>
              {[1, 2, 3].map((n) => (
                <span key={n} className={`h-3 w-1.5 rounded-sm ${n <= conf.bars ? 'bg-primary' : 'bg-line'}`} />
              ))}
            </span>
            <span className="text-xs font-medium text-muted">{conf.label}</span>
          </div>
        </div>
        <p className="mt-2 leading-relaxed text-ink">{session.ai_diagnosis}</p>

        {session.likely_causes.length > 0 && (
          <div className="mt-5">
            <p className="label">Likely causes, most likely first</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {session.likely_causes.map((c, i) => (
                <li key={i} className="chip text-ink/80">
                  <span className="figure text-faint">{i + 1}</span> {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5">
          <p className="label">Try these, in order</p>
          <ol className="mt-2 space-y-2">
            {session.suggested_fixes.map((fix, i) => {
              const done = checked.has(i)
              return (
                <li key={i}>
                  <label className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition ${done ? 'border-completed/30 bg-completed-soft/50' : 'border-line hover:border-strong'}`}>
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-strong accent-completed"
                      checked={done}
                      onChange={() =>
                        setChecked((s) => {
                          const next = new Set(s)
                          if (next.has(i)) next.delete(i)
                          else next.add(i)
                          return next
                        })
                      }
                    />
                    <span className={done ? 'text-muted line-through decoration-completed/50' : 'text-ink'}>
                      <span className="figure mr-1.5 text-faint">{i + 1}.</span>
                      {fix}
                    </span>
                  </label>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="mt-6 rounded-xl bg-sunk/70 p-4">
          {session.resolved || session.resolution_note ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="text-sm">
                <p className="font-medium text-ink">{session.resolved ? 'What fixed it' : 'Still open'}</p>
                {session.resolution_note && <p className="mt-1 text-muted">{session.resolution_note}</p>}
              </div>
              <button type="button" className="btn-quiet shrink-0 px-2 py-1 text-xs" onClick={() => setClosing(session.resolved ? 'yes' : 'no')}>
                Update
              </button>
            </div>
          ) : (
            closing == null && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-ink">Did this sort it out?</p>
                <div className="flex gap-2">
                  <button type="button" className="btn-ghost py-1.5" onClick={() => setClosing('yes')}>
                    Yes, fixed
                  </button>
                  <button type="button" className="btn-quiet py-1.5" onClick={() => setClosing('no')}>
                    Not yet
                  </button>
                </div>
              </div>
            )
          )}

          {closing && (
            <div className="mt-3 space-y-2">
              <label htmlFor={`note-${session.id}`} className="text-sm text-muted">
                {closing === 'yes' ? 'What actually fixed it? Future you will want to know.' : 'What did you try, and what happened?'}
              </label>
              <textarea id={`note-${session.id}`} rows={2} className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder={closing === 'yes' ? 'Dropped bed temp to 55 and added a brim' : 'Tightened the belts, still shifting at layer 40'} />
              <div className="flex gap-2">
                <button type="button" className="btn-primary py-1.5" onClick={() => save(closing === 'yes')} disabled={saving}>
                  {saving ? 'Saving…' : closing === 'yes' ? 'Mark solved' : 'Save note'}
                </button>
                <button type="button" className="btn-quiet py-1.5" onClick={() => setClosing(null)}>
                  Cancel
                </button>
              </div>
              {error && <p className="text-xs text-danger">{error}</p>}
            </div>
          )}
        </div>

        <div className="mt-3 text-right">
          <button type="button" onClick={remove} disabled={deleting} className="text-xs text-faint hover:text-danger">
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}
