import { CraftIcon } from '../projects/CraftIcon'
import { StatusBadge } from '../projects/StatusBadge'

// A made up project, drawn with the real components' styling, for the landing
// and sign in pages. No photo, so it's a sketch of a cover instead.
export function SampleLog({ className = '' }: { className?: string }) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="relative h-32 border-b border-line bg-primary-wash">
        <svg viewBox="0 0 400 128" className="absolute inset-0 h-full w-full text-primary/25" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <g fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="110" y="34" width="180" height="16" rx="2" />
            <path d="M124 50v58M276 50v58M140 50v40M260 50v40M124 90h152" />
          </g>
        </svg>
        <div className="ruler absolute inset-x-0 bottom-0 h-3" />
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="label inline-flex items-center gap-1.5">
            <CraftIcon craft="woodworking" className="h-3.5 w-3.5" />
            Woodworking
          </span>
          <StatusBadge status="in_progress" />
        </div>
        <p className="heading mt-2 text-xl">Walnut side table</p>
        <div className="mt-4 grid grid-cols-3 gap-3 border-y border-line py-3">
          <Stat label="Time" value="14h 30m" />
          <Stat label="Materials" value="$186" />
          <Stat label="Entries" value="9" />
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <Entry when="Sat, 2h 15m" text="Glued up the aprons. Two clamps short, so the back joint has a hairline gap." />
          <div className="rounded-xl border border-primary/20 bg-primary-wash p-3">
            <p className="label text-primary">Diagnosis</p>
            <p className="mt-1 text-ink">The gap is from uneven clamp pressure, not the joint itself. Re-glue with a caul across the back rail.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className="figure mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  )
}

function Entry({ when, text }: { when: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
      <div>
        <p className="figure text-xs text-faint">{when}</p>
        <p className="text-muted">{text}</p>
      </div>
    </div>
  )
}
