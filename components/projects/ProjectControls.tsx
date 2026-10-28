'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { postJson } from '@/lib/api'
import { STATUS_LABELS } from '@/lib/crafts'
import { STATUSES, type Project, type ProjectStatus } from '@/lib/types'
import { ProjectForm } from './ProjectForm'

// Status switcher plus edit and delete. Finishing a project is the moment
// worth making easy, so it gets its own button while the project is active.
export function ProjectControls({ project }: { project: Project }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ message: string; limit: boolean } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function setStatus(status: ProjectStatus) {
    if (status === project.status) return
    setBusy(true)
    setError(null)
    try {
      await postJson(`/api/projects/${project.id}`, { status }, 'PATCH')
      router.refresh()
    } catch (e) {
      const message = (e as Error).message
      setError({ message, limit: message.includes('free plan') })
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      await postJson(`/api/projects/${project.id}`, {}, 'DELETE')
      router.push('/projects')
      router.refresh()
    } catch (e) {
      setError({ message: (e as Error).message, limit: false })
      setBusy(false)
    }
  }

  const active = project.status === 'planning' || project.status === 'in_progress'

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {active && (
          <button type="button" className="btn border border-completed/30 bg-completed-soft text-completed-ink hover:bg-completed hover:text-white" onClick={() => setStatus('completed')} disabled={busy}>
            <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" aria-hidden>
              <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mark finished
          </button>
        )}
        <label className="sr-only" htmlFor="status">
          Status
        </label>
        <select id="status" className="input w-auto py-2 pr-8 font-medium" value={project.status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} disabled={busy}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="button" className="btn-ghost py-2" onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error.message}{' '}
          {error.limit && (
            <Link href="/settings#plan" className="font-semibold underline underline-offset-2">
              See Pro
            </Link>
          )}
        </p>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Edit project" onClick={() => setEditing(false)}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-surface p-6 shadow-lift sm:rounded-2xl sm:p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="heading mb-6 text-2xl">Edit project</h2>
            <ProjectForm project={project} onDone={() => setEditing(false)} />
            <div className="mt-8 border-t border-line pt-5">
              {confirmDelete ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted">Delete this project, every entry, material, photo and troubleshoot? This can&rsquo;t be undone.</p>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" className="btn-quiet" onClick={() => setConfirmDelete(false)} disabled={busy}>
                      Keep it
                    </button>
                    <button type="button" className="btn-danger" onClick={remove} disabled={busy}>
                      {busy ? 'Deleting…' : 'Delete project'}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="text-sm font-medium text-danger hover:underline" onClick={() => setConfirmDelete(true)}>
                  Delete this project
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
