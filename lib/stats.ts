import { daysBetween } from './format'
import { CRAFT_TYPES, type CraftType, type Project } from './types'

export interface EntryLite {
  project_id: string
  logged_at: string
  time_spent_hours: number | null
}

export interface CraftSummary {
  craft: CraftType
  projects: number
  completed: number
  hours: number
  cost: number
}

export interface MonthBucket {
  key: string // YYYY-MM
  label: string
  total: number
  hours: Partial<Record<CraftType, number>>
}

export interface ProgressionPoint {
  id: string
  name: string
  craft: CraftType
  completed_at: string
  hours: number
  cost: number
  days: number | null
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function craftBreakdown(projects: Project[]): CraftSummary[] {
  const map = new Map<CraftType, CraftSummary>()
  for (const p of projects) {
    const s = map.get(p.craft_type) ?? { craft: p.craft_type, projects: 0, completed: 0, hours: 0, cost: 0 }
    s.projects += 1
    if (p.status === 'completed') s.completed += 1
    s.hours += p.total_time_hours
    s.cost += p.total_material_cost
    map.set(p.craft_type, s)
  }
  // Fixed craft order, not ranked, so colours and rows stay put between visits.
  return CRAFT_TYPES.filter((c) => map.has(c)).map((c) => {
    const s = map.get(c)!
    return { ...s, hours: round1(s.hours), cost: Math.round(s.cost * 100) / 100 }
  })
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Hours logged per month for the last `months` months, split by craft.
// Months with nothing logged are kept, so gaps show as gaps.
export function monthlyHours(entries: EntryLite[], craftOf: (projectId: string) => CraftType | undefined, months = 12, now = new Date()): MonthBucket[] {
  const buckets: MonthBucket[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ key: monthKey(d), label: d.toLocaleDateString('en-GB', { month: 'short' }), total: 0, hours: {} })
  }
  const index = new Map(buckets.map((b, i) => [b.key, i]))

  for (const e of entries) {
    const h = e.time_spent_hours ?? 0
    if (h <= 0) continue
    const i = index.get(monthKey(new Date(e.logged_at)))
    const craft = craftOf(e.project_id)
    if (i == null || !craft) continue
    const b = buckets[i]
    b.hours[craft] = round1((b.hours[craft] ?? 0) + h)
    b.total = round1(b.total + h)
  }
  return buckets
}

// Finished projects in the order they were finished, for "how am I getting
// on" comparisons within a craft.
export function progression(projects: Project[]): ProgressionPoint[] {
  return projects
    .filter((p) => p.status === 'completed' && p.completed_at)
    .sort((a, b) => a.completed_at!.localeCompare(b.completed_at!))
    .map((p) => ({
      id: p.id,
      name: p.name,
      craft: p.craft_type,
      completed_at: p.completed_at!,
      hours: round1(p.total_time_hours),
      cost: p.total_material_cost,
      days: daysBetween(p.started_at, p.completed_at),
    }))
}

export function totals(projects: Project[]) {
  const completed = projects.filter((p) => p.status === 'completed')
  const hours = projects.reduce((s, p) => s + p.total_time_hours, 0)
  const cost = projects.reduce((s, p) => s + p.total_material_cost, 0)
  const finishedTimed = completed.filter((p) => p.total_time_hours > 0)
  const finishedRate = projects.filter((p) => p.status === 'completed' || p.status === 'abandoned').length
  return {
    projects: projects.length,
    completed: completed.length,
    hours: round1(hours),
    cost: Math.round(cost * 100) / 100,
    avgHoursPerFinished: finishedTimed.length ? round1(finishedTimed.reduce((s, p) => s + p.total_time_hours, 0) / finishedTimed.length) : null,
    // Of the projects that reached an end, how many got finished rather than shelved.
    finishRate: finishedRate ? Math.round((completed.length / finishedRate) * 100) : null,
  }
}

// How many weeks in a row have at least one entry, counting back from this
// week (or last week, if nothing is logged yet this week). A gentle measure of
// showing up, not a streak to protect.
export function activeWeeks(entries: EntryLite[], now = new Date()): number {
  const weekOf = (d: Date) => {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    const day = (t.getUTCDay() + 6) % 7
    t.setUTCDate(t.getUTCDate() - day)
    return t.getTime()
  }
  const weeks = new Set(entries.map((e) => weekOf(new Date(e.logged_at))))
  const WEEK = 7 * 86_400_000
  let cursor = weekOf(now)
  if (!weeks.has(cursor)) cursor -= WEEK
  let run = 0
  while (weeks.has(cursor)) {
    run += 1
    cursor -= WEEK
  }
  return run
}
