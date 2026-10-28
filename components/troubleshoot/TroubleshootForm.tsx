'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PhotoPicker, type PickedPhoto } from '@/components/projects/PhotoPicker'
import { postJson } from '@/lib/api'
import type { CraftType, TroubleshootSession } from '@/lib/types'
import { TroubleshootResult } from './TroubleshootResult'

const EXAMPLES: Record<CraftType, string[]> = {
  '3d_printing': ['Corners lifting off the bed after a few layers', 'Thin strings between the towers', 'Layers shifted sideways halfway up'],
  woodworking: ['Tear out on the end grain after routing', 'Gap in the mitre after glue up', 'Stain went on blotchy'],
  knitting_crochet: ['Swatch is 22 stitches, pattern wants 20', 'Stockinette keeps curling at the edges', 'Rows look uneven on the purl side'],
  sewing: ['Seam puckers on lightweight cotton', 'Machine keeps skipping stitches', 'Knit hem goes wavy'],
  pottery: ['Hairline crack at the base after bisque', 'Glaze crawled and left bare patches', 'Bowl warped in the firing'],
  model_building: ['White fog around the glued parts', 'Airbrushed coat looks rough and grainy', 'Visible seam line down the middle'],
  electronics: ['LED flickers when the motor runs', 'Board resets randomly', 'One joint looks dull and lumpy'],
  other: ['It came out uneven', "It's not holding together", 'The finish looks wrong'],
}

const THINKING = ['Looking at the photo…', 'Checking the usual suspects…', 'Reading your log entries…', 'Putting the fixes in order…']

// The form and the history live together so a new diagnosis can sit at the
// top of the list, highlighted, as soon as it comes back.
export function TroubleshootForm({
  projectId,
  craft,
  sessions,
  logPhotos,
  photoUrls,
}: {
  projectId: string
  craft: CraftType
  sessions: TroubleshootSession[]
  logPhotos: { path: string; url: string }[]
  photoUrls: Record<string, string>
}) {
  const router = useRouter()
  const [photo, setPhoto] = useState<PickedPhoto | null>(null)
  const [fromLog, setFromLog] = useState<string | null>(null)
  const [problem, setProblem] = useState('')
  const [uploading, setUploading] = useState(false)
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [fresh, setFresh] = useState<{ session: TroubleshootSession; needsBetterPhoto: boolean; previewUrl?: string } | null>(null)

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setStep((s) => (s + 1) % THINKING.length), 2200)
    return () => clearInterval(t)
  }, [running])

  const photoPath = photo?.path ?? fromLog
  const preview = photo?.preview ?? (fromLog ? photoUrls[fromLog] : undefined)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setRunning(true)
    setStep(0)
    setError(null)
    try {
      const res = await postJson<{ session: TroubleshootSession; needs_better_photo: boolean }>('/api/troubleshoot', {
        project_id: projectId,
        photo_url: photoPath,
        problem_description: problem,
      })
      setFresh({ session: res.session, needsBetterPhoto: res.needs_better_photo, previewUrl: preview })
      setPhoto(null)
      setFromLog(null)
      setProblem('')
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setRunning(false)
    }
  }

  // Until the refresh lands, the new session only exists in local state.
  const list = fresh && !sessions.some((s) => s.id === fresh.session.id) ? [fresh.session, ...sessions] : sessions

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="card p-5 sm:p-6">
        <div className="grid gap-5 md:grid-cols-[18rem_1fr]">
          <div>
            <p className="field-label">Photo of the problem</p>
            <div className="relative">
              {fromLog && !photo ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-sunk">
                  <img src={photoUrls[fromLog]} alt="From your log" className="h-full w-full object-cover" />
                  <button type="button" className="absolute right-2 top-2 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-danger shadow-sm" onClick={() => setFromLog(null)}>
                    Remove
                  </button>
                </div>
              ) : (
                <PhotoPicker projectId={projectId} value={photo} onChange={setPhoto} onBusy={setUploading} label="Take or pick a photo" tall />
              )}
              {running && preview && (
                <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[4/3] overflow-hidden rounded-xl" aria-hidden>
                  <div className="absolute inset-x-0 h-1/3 animate-scan bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
                </div>
              )}
            </div>
            {!photo && !fromLog && logPhotos.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-faint">Or use one from the log</p>
                <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1">
                  {logPhotos.slice(0, 8).map((p) => (
                    <button key={p.path} type="button" onClick={() => setFromLog(p.path)} className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line hover:border-primary" aria-label="Use this photo">
                      <img src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="hint">Optional, but it helps a lot. Get close, use good light, and fill the frame with the problem.</p>
          </div>

          <div className="flex flex-col">
            <label htmlFor="problem" className="field-label">
              What&rsquo;s going wrong?
            </label>
            <textarea
              id="problem"
              rows={6}
              className="input flex-1 resize-y"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="What you expected, what happened instead, and anything you've already tried."
              maxLength={2000}
              required
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {EXAMPLES[craft].map((ex) => (
                <button key={ex} type="button" className="chip hover:border-strong hover:text-ink" onClick={() => setProblem((p) => (p ? `${p} ${ex}.` : `${ex}.`))}>
                  {ex}
                </button>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-faint">Your project notes, recent log entries and earlier fixes are included so the advice fits your setup.</p>
              <button type="submit" className="btn-primary shrink-0" disabled={running || uploading || problem.trim().length < 8}>
                {running ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span aria-live="polite">{THINKING[step]}</span>
                  </>
                ) : uploading ? (
                  'Waiting for photo…'
                ) : (
                  'Diagnose'
                )}
              </button>
            </div>
            {error && (
              <p role="alert" className="mt-3 text-sm text-danger">
                {error}
              </p>
            )}
          </div>
        </div>
      </form>

      {list.length > 0 && (
        <section aria-labelledby="history">
          <h2 id="history" className="heading mb-4 text-xl">
            Troubleshooting history
          </h2>
          <div className="space-y-5">
            {list.map((s) => {
              const isFresh = s.id === fresh?.session.id
              const url = (s.photo_url && photoUrls[s.photo_url]) || (isFresh ? fresh?.previewUrl : undefined)
              return <TroubleshootResult key={s.id} session={s} photoUrl={url} fresh={isFresh} needsBetterPhoto={isFresh && fresh?.needsBetterPhoto} />
            })}
          </div>
        </section>
      )}
    </div>
  )
}
