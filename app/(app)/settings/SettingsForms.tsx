'use client'

import { useState, useTransition } from 'react'
import { CURRENCIES } from '@/lib/currencies'
import { deleteAccount, setCurrency } from './actions'

export function CurrencyForm({ current }: { current: string }) {
  const [pending, start] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null)
          setSaved(false)
          try {
            await setCurrency(fd)
            setSaved(true)
          } catch (e) {
            setError((e as Error).message)
          }
        })
      }
      className="flex flex-wrap items-center gap-2"
    >
      <label htmlFor="currency" className="sr-only">
        Currency
      </label>
      <select id="currency" name="currency" defaultValue={current} className="input w-auto py-2" onChange={() => setSaved(false)}>
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} · {c.label}
          </option>
        ))}
      </select>
      <button className="btn-ghost py-2" disabled={pending}>
        {pending ? 'Saving…' : 'Save'}
      </button>
      {saved && <span className="text-sm text-completed-ink">Saved</span>}
      {error && <span className="text-sm text-danger">{error}</span>}
    </form>
  )
}

export function DeleteAccount({ projects }: { projects: number }) {
  const [pending, start] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Removes your account, {projects} {projects === 1 ? 'project' : 'projects'} and every photo. Export first if you want a copy. This can&rsquo;t be undone.
        </p>
        {confirming ? (
          <div className="flex shrink-0 gap-2">
            <button type="button" className="btn-quiet" onClick={() => setConfirming(false)} disabled={pending}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  try {
                    await deleteAccount()
                  } catch (e) {
                    setError((e as Error).message)
                  }
                })
              }
            >
              {pending ? 'Deleting…' : 'Yes, delete it all'}
            </button>
          </div>
        ) : (
          <button type="button" className="btn-ghost shrink-0" onClick={() => setConfirming(true)}>
            Delete account
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  )
}
