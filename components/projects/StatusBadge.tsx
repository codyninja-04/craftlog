import { STATUS_LABELS } from '@/lib/crafts'
import type { ProjectStatus } from '@/lib/types'

const STYLES: Record<ProjectStatus, string> = {
  planning: 'border-strong bg-sunk text-muted',
  in_progress: 'border-progress/30 bg-progress-soft text-progress-ink',
  completed: 'border-completed/30 bg-completed-soft text-completed-ink',
  abandoned: 'border-line bg-sunk text-faint',
}

const DOTS: Record<ProjectStatus, string> = {
  planning: 'border border-faint bg-transparent',
  in_progress: 'bg-progress',
  completed: 'bg-completed',
  abandoned: 'bg-strong',
}

// Text plus a dot shape, so status never relies on colour alone.
export function StatusBadge({ status, className = '' }: { status: ProjectStatus; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]} ${className}`}>
      {status === 'completed' ? (
        <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
          <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full ${DOTS[status]}`} />
      )}
      {STATUS_LABELS[status]}
    </span>
  )
}
