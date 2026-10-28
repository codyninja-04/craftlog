'use client'

import { useRef, useState } from 'react'
import { uploadProjectPhoto } from '@/lib/photos/client'

export interface PickedPhoto {
  path: string
  preview: string
}

// Phones offer camera or library, desktops the file picker. Uploads as soon as
// a photo is picked so saving the entry afterwards is instant.
export function PhotoPicker({
  projectId,
  value,
  onChange,
  onBusy,
  label = 'Add a photo',
  tall = false,
}: {
  projectId: string
  value: PickedPhoto | null
  onChange: (photo: PickedPhoto | null) => void
  onBusy?: (busy: boolean) => void
  label?: string
  tall?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pick(file: File | undefined) {
    if (!file) return
    setError(null)
    setUploading(true)
    onBusy?.(true)
    try {
      const path = await uploadProjectPhoto(file, projectId)
      onChange({ path, preview: URL.createObjectURL(file) })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
      onBusy?.(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} tabIndex={-1} />
      {value ? (
        <div className={`relative overflow-hidden rounded-xl border border-line bg-sunk ${tall ? 'aspect-[4/3]' : 'h-40'}`}>
          <img src={value.preview} alt="Selected" className="h-full w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button type="button" className="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm hover:bg-white" onClick={() => input.current?.click()}>
              Replace
            </button>
            <button type="button" className="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-danger shadow-sm hover:bg-white" onClick={() => onChange(null)}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={uploading}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-strong bg-sunk/50 text-sm text-muted transition hover:border-primary hover:bg-primary-wash hover:text-primary-dark disabled:cursor-wait ${
            tall ? 'aspect-[4/3]' : 'h-24'
          }`}
        >
          {uploading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              Uploading…
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              {label}
            </>
          )}
        </button>
      )}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  )
}
