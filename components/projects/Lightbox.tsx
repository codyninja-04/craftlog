'use client'

import { useEffect } from 'react'

export interface LightboxPhoto {
  url: string
  caption?: string
  meta?: string
}

// Full screen photo viewer. Arrow keys page through, Escape closes.
export function Lightbox({ photos, index, onIndex, onClose, actions }: { photos: LightboxPhoto[]; index: number; onIndex: (i: number) => void; onClose: () => void; actions?: React.ReactNode }) {
  const photo = photos[index]

  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && index < photos.length - 1) onIndex(index + 1)
      if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1)
    }
    window.addEventListener('keydown', key)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', key)
      document.body.style.overflow = overflow
    }
  }, [index, photos.length, onClose, onIndex])

  if (!photo) return null

  return (
    <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-50 flex flex-col bg-ink/95 text-white" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
        <span className="figure text-white/60">
          {index + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-2">
          {actions}
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 font-semibold hover:bg-white/10" autoFocus>
            Close
          </button>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-14">
        <img src={photo.url} alt={photo.caption ?? ''} className="max-h-full max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
        {index > 0 && (
          <button type="button" aria-label="Previous photo" className="absolute left-2 rounded-full bg-white/10 px-3 py-2 text-xl hover:bg-white/20" onClick={(e) => (e.stopPropagation(), onIndex(index - 1))}>
            ‹
          </button>
        )}
        {index < photos.length - 1 && (
          <button type="button" aria-label="Next photo" className="absolute right-2 rounded-full bg-white/10 px-3 py-2 text-xl hover:bg-white/20" onClick={(e) => (e.stopPropagation(), onIndex(index + 1))}>
            ›
          </button>
        )}
      </div>
      {(photo.caption || photo.meta) && (
        <div className="mx-auto w-full max-w-2xl px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
          {photo.meta && <p className="figure text-xs text-white/50">{photo.meta}</p>}
          {photo.caption && <p className="mt-1 line-clamp-3 text-sm text-white/85">{photo.caption}</p>}
        </div>
      )}
    </div>
  )
}
