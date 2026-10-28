import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { CraftIcon } from '@/components/projects/CraftIcon'
import { CraftBreakdown } from '@/components/stats/CraftBreakdown'
import { MonthlyHoursChart } from '@/components/stats/MonthlyHoursChart'
import { requireUser } from '@/lib/auth'
import { CRAFT_COLORS, CRAFT_LABELS } from '@/lib/crafts'
import { formatDate, formatHours, formatMoney } from '@/lib/format'
import { limitsFor } from '@/lib/plan'
import { PROJECT_COLUMNS, toProject } from '@/lib/projects'
import { activeWeeks, craftBreakdown, monthlyHours, progression, totals, type EntryLite } from '@/lib/stats'
import { CRAFT_TYPES, type CraftType } from '@/lib/types'

export const metadata: Metadata = { title: 'Stats' }

export default async function StatsPage() {
  const { supabase, plan, currency } = await requireUser()

  if (!limitsFor(plan).stats) {
    return (
      <>
        <PageHeader title="Stats" sub="Where your time and money go across every project." />
        <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="heading text-lg">Stats are part of Pro</p>
            <p className="mt-1 text-sm text-muted">Hours by month, cost by craft, and how your builds are getting faster over time. $5 a month.</p>
          </div>
          <Link href="/settings#plan" className="btn-primary shrink-0">
            See Pro
          </Link>
        </div>
      </>
    )
  }

  const since = new Date()
  since.setMonth(since.getMonth() - 12, 1)
  const [{ data: projectRows }, { data: entryRows }, { data: lessonRows }] = await Promise.all([
    supabase.from('craft_projects').select(PROJECT_COLUMNS).limit(1000),
    supabase.from('project_log_entries').select('project_id, logged_at, time_spent_hours').gte('logged_at', since.toISOString()).limit(10000),
    supabase
      .from('troubleshoot_sessions')
      .select('id, project_id, problem_description, resolution_note, resolved_at')
      .eq('resolved', true)
      .not('resolution_note', 'is', null)
      .order('resolved_at', { ascending: false })
      .limit(8),
  ])

  const projects = (projectRows ?? []).map(toProject)
  const entries: EntryLite[] = (entryRows ?? []).map((e) => ({ project_id: e.project_id, logged_at: e.logged_at, time_spent_hours: e.time_spent_hours == null ? null : Number(e.time_spent_hours) }))
  const craftOf = new Map(projects.map((p) => [p.id, p.craft_type]))
  const nameOf = new Map(projects.map((p) => [p.id, p.name]))

  if (projects.length === 0) {
    return (
      <>
        <PageHeader title="Stats" sub="Where your time and money go across every project." />
        <div className="card px-6 py-14 text-center">
          <p className="heading text-xl">Nothing to count yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">Log a few sessions with time and materials and this page fills itself in.</p>
          <Link href="/projects/new" className="btn-primary mt-5">
            Start a project
          </Link>
        </div>
      </>
    )
  }

  const t = totals(projects)
  const breakdown = craftBreakdown(projects)
  const months = monthlyHours(entries, (id) => craftOf.get(id))
  const monthCrafts = CRAFT_TYPES.filter((c) => months.some((m) => (m.hours[c] ?? 0) > 0))
  const loggedThisYear = months.reduce((s, m) => s + m.total, 0)
  const weeks = activeWeeks(entries)
  const finished = progression(projects)
  const progressionByCraft = CRAFT_TYPES.map((c) => ({ craft: c, points: finished.filter((p) => p.craft === c && p.hours > 0) })).filter((g) => g.points.length >= 2)

  return (
    <>
      <PageHeader title="Stats" sub="Where your time and money go, and how your builds change as you get better." />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Hours at the bench" value={formatHours(t.hours)} sub={`${formatHours(loggedThisYear)} in the last 12 months`} />
        <Tile label="Spent on materials" value={formatMoney(t.cost, currency)} sub={t.hours > 0 ? `${formatMoney(t.cost / t.hours, currency)} per hour of making` : undefined} />
        <Tile label="Finished" value={`${t.completed} of ${t.projects}`} sub={t.finishRate != null ? `${t.finishRate}% finished rather than shelved` : undefined} />
        <Tile label="Weeks in a row" value={String(weeks)} sub={weeks ? 'with at least one entry' : 'Log something this week to start'} />
      </dl>

      <section className="card mt-6 p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="heading text-lg">Hours logged per month</h2>
          <p className="text-xs text-faint">Last 12 months, from log entries with time</p>
        </div>
        {monthCrafts.length === 0 ? <p className="py-10 text-center text-sm text-muted">No timed sessions in the last 12 months yet.</p> : <MonthlyHoursChart months={months} crafts={monthCrafts} />}
      </section>

      <section className="card mt-6 p-5 sm:p-6">
        <h2 className="heading mb-4 text-lg">By craft</h2>
        <CraftBreakdown rows={breakdown} currency={currency} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="heading text-lg">How your builds are changing</h2>
          <p className="mt-1 text-sm text-muted">Finished projects in each craft, oldest first. Hours aren&rsquo;t everything, but they say something.</p>
          {progressionByCraft.length === 0 ? (
            <p className="mt-6 rounded-xl bg-sunk/70 p-4 text-sm text-muted">Finish two timed projects in the same craft and you&rsquo;ll see them side by side here.</p>
          ) : (
            <div className="mt-5 space-y-6">
              {progressionByCraft.map(({ craft, points }) => (
                <Progression key={craft} craft={craft} points={points} />
              ))}
            </div>
          )}
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="heading text-lg">Lessons learned</h2>
          <p className="mt-1 text-sm text-muted">Problems you solved, and what actually fixed them.</p>
          {(lessonRows ?? []).length === 0 ? (
            <p className="mt-6 rounded-xl bg-sunk/70 p-4 text-sm text-muted">When a troubleshoot works out, mark it solved with a note on what fixed it. Those notes collect here.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {(lessonRows ?? []).map((l) => (
                <li key={l.id} className="border-l-2 border-completed pl-3">
                  <p className="text-sm text-muted">{l.problem_description}</p>
                  <p className="mt-1 text-sm font-medium text-ink">{l.resolution_note}</p>
                  <p className="mt-1 text-xs text-faint">
                    <Link href={`/projects/${l.project_id}`} className="hover:text-ink hover:underline">
                      {nameOf.get(l.project_id) ?? 'Project'}
                    </Link>
                    {l.resolved_at && ` · ${formatDate(l.resolved_at)}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <dt className="label">{label}</dt>
      <dd className="figure mt-2 text-2xl font-semibold text-ink sm:text-3xl">{value}</dd>
      {sub && <dd className="mt-1 text-xs text-faint">{sub}</dd>}
    </div>
  )
}

function Progression({ craft, points }: { craft: CraftType; points: ReturnType<typeof progression> }) {
  const shown = points.slice(-6)
  const max = Math.max(...shown.map((p) => p.hours))
  const first = points[0]
  const last = points[points.length - 1]
  const change = first.hours > 0 ? Math.round(((last.hours - first.hours) / first.hours) * 100) : null

  return (
    <div>
      <p className="label inline-flex items-center gap-1.5">
        <CraftIcon craft={craft} className="h-3.5 w-3.5" />
        {CRAFT_LABELS[craft]}
      </p>
      <ul className="mt-2 space-y-1.5">
        {shown.map((p) => (
          <li key={p.id} className="grid grid-cols-[minmax(0,9rem)_1fr_3.5rem] items-center gap-3 text-sm" title={`${p.name}: ${formatHours(p.hours)}`}>
            <Link href={`/projects/${p.id}`} className="truncate text-muted hover:text-ink">
              {p.name}
            </Link>
            <div className="h-2 overflow-hidden rounded-r bg-sunk">
              <div className="h-full rounded-r" style={{ width: `${(p.hours / max) * 100}%`, background: CRAFT_COLORS[craft] }} />
            </div>
            <span className="figure text-right text-xs text-ink">{formatHours(p.hours)}</span>
          </li>
        ))}
      </ul>
      {change != null && change !== 0 && (
        <p className="mt-2 text-xs text-muted">
          Your latest took <span className="figure font-medium text-ink">{Math.abs(change)}%</span> {change < 0 ? 'less' : 'more'} time than your first.
        </p>
      )}
    </div>
  )
}
