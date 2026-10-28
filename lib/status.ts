import { isActive } from './crafts'
import type { Project, ProjectStatus } from './types'

// Dates that should move along with a status change. Completing stamps
// completed_at, going back to work clears it, and starting stamps started_at
// if it was never set. Dates the user typed in themselves are kept.
export function statusDates(
  current: Pick<Project, 'status' | 'started_at' | 'completed_at'>,
  next: ProjectStatus,
  today: string,
): Partial<Pick<Project, 'started_at' | 'completed_at'>> {
  const out: Partial<Pick<Project, 'started_at' | 'completed_at'>> = {}
  if (next === current.status) return out

  if ((next === 'in_progress' || next === 'completed') && !current.started_at) out.started_at = today
  if (next === 'completed' && !current.completed_at) out.completed_at = today
  if (next !== 'completed' && current.completed_at) out.completed_at = null
  return out
}

// Whether this change adds one to the active project count.
export function becomesActive(from: ProjectStatus | null, to: ProjectStatus): boolean {
  return isActive(to) && (from == null || !isActive(from))
}
