'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { postJson } from '@/lib/api'
import { CRAFT_HINTS, CRAFT_LABELS, STATUS_LABELS } from '@/lib/crafts'
import { today } from '@/lib/format'
import { CRAFT_TYPES, type CraftType, type Project, type ProjectStatus } from '@/lib/types'
import { CraftIcon } from './CraftIcon'

const START_STATUSES: ProjectStatus[] = ['planning', 'in_progress', 'completed']

export function ProjectForm({ project, onDone }: { project?: Project; onDone?: () => void }) {
  const router = useRouter()
  const editing = !!project
  const [name, setName] = useState(project?.name ?? '')
  const [craft, setCraft] = useState<CraftType>(project?.craft_type ?? 'woodworking')
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'in_progress')
  const [startedAt, setStartedAt] = useState(project?.started_at ?? (editing ? '' : today()))
  const [completedAt, setCompletedAt] = useState(project?.completed_at ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<{ message: string; limit?: boolean } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const body = {
      name,
      craft_type: craft,
      description,
      started_at: status === 'planning' && !editing ? null : startedAt || null,
      ...(editing ? { completed_at: status === 'completed' ? completedAt || today() : null } : {}),
      status,
    }
    try {
      if (editing) {
        await postJson(`/api/projects/${project.id}`, body, 'PATCH')
        router.refresh()
        onDone?.()
      } else {
        const res = await postJson<{ project: Project }>('/api/projects', body)
        router.push(`/projects/${res.project.id}`)
        router.refresh()
      }
    } catch (err) {
      const message = (err as Error).message
      setError({ message, limit: message.includes('free plan') })
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <div>
        <label htmlFor="name" className="field-label">
          What are you making?
        </label>
        <input
          id="name"
          className="input text-base"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Walnut side table, Benchy calibration print, raglan sweater…"
          maxLength={120}
          required
          autoFocus={!editing}
        />
      </div>

      <fieldset>
        <legend className="field-label">Craft</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CRAFT_TYPES.map((c) => {
            const selected = craft === c
            return (
              <label
                key={c}
                className={`flex cursor-pointer flex-col items-start gap-2 rounded-xl border p-3 text-sm font-medium transition ${
                  selected ? 'border-primary bg-primary-wash text-primary-dark ring-4 ring-primary/10' : 'border-line bg-surface text-muted hover:border-strong hover:text-ink'
                }`}
              >
                <input type="radio" name="craft" value={c} checked={selected} onChange={() => setCraft(c)} className="sr-only" />
                <CraftIcon craft={c} className="h-5 w-5" />
                {CRAFT_LABELS[c]}
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <fieldset>
          <legend className="field-label">Where is it at?</legend>
          <div className="flex flex-wrap gap-1.5">
            {(editing ? (['planning', 'in_progress', 'completed', 'abandoned'] as ProjectStatus[]) : START_STATUSES).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                aria-pressed={status === s}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${status === s ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-muted hover:border-strong'}`}
              >
                {!editing && s === 'completed' ? 'Already done' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </fieldset>
        {(editing || status !== 'planning') && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="started" className="field-label">
                Started
              </label>
              <input id="started" type="date" className="input" value={startedAt} max={today()} onChange={(e) => setStartedAt(e.target.value)} />
            </div>
            {editing && status === 'completed' && (
              <div>
                <label htmlFor="completed" className="field-label">
                  Finished
                </label>
                <input id="completed" type="date" className="input" value={completedAt} min={startedAt || undefined} max={today()} onChange={(e) => setCompletedAt(e.target.value)} />
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="desc" className="field-label">
          Notes <span className="font-normal text-faint">(optional)</span>
        </label>
        <textarea id="desc" rows={4} className="input resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={CRAFT_HINTS[craft]} maxLength={2000} />
        <p className="hint">Materials, settings and sizes here make troubleshooting a lot more accurate later.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error.message}
          {error.limit && (
            <Link href="/settings#plan" className="ml-1 font-semibold underline underline-offset-2">
              See Pro
            </Link>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={saving || !name.trim()}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create project'}
        </button>
        {editing ? (
          <button type="button" className="btn-quiet" onClick={onDone}>
            Cancel
          </button>
        ) : (
          <Link href="/projects" className="btn-quiet">
            Cancel
          </Link>
        )}
      </div>
    </form>
  )
}
