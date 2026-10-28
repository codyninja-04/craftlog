import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { CraftIcon } from '@/components/projects/CraftIcon'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { displayName, requireUser } from '@/lib/auth'
import { CRAFT_LABELS, isActive } from '@/lib/crafts'
import { formatHours } from '@/lib/format'
import { signPhotos } from '@/lib/photos/server'
import { PROJECT_COLUMNS, pickCover, toProject } from '@/lib/projects'
import { CRAFT_TYPES, type CraftType, type Project } from '@/lib/types'

export const metadata: Metadata = { title: 'Projects' }

const VIEWS = [
  { key: 'active', label: 'On the bench', match: (p: Project) => isActive(p.status) },
  { key: 'completed', label: 'Finished', match: (p: Project) => p.status === 'completed' },
  { key: 'abandoned', label: 'Shelved', match: (p: Project) => p.status === 'abandoned' },
  { key: 'all', label: 'Everything', match: () => true },
] as const

export default async function ProjectsPage({ searchParams }: { searchParams: { view?: string; craft?: string } }) {
  const { supabase, user, currency } = await requireUser()

  const [{ data: projectRows }, { data: entryRows }] = await Promise.all([
    supabase.from('craft_projects').select(PROJECT_COLUMNS).order('updated_at', { ascending: false }).limit(500),
    supabase.from('project_log_entries').select('project_id, photo_url, is_milestone, logged_at, time_spent_hours').order('logged_at', { ascending: false }).limit(5000),
  ])
  const projects = (projectRows ?? []).map(toProject)
  const entries = (entryRows ?? []) as { project_id: string; photo_url: string | null; is_milestone: boolean; logged_at: string; time_spent_hours: number | string | null }[]

  const view = VIEWS.find((v) => v.key === searchParams.view) ?? VIEWS[0]
  const craft = (CRAFT_TYPES as readonly string[]).includes(searchParams.craft ?? '') ? (searchParams.craft as CraftType) : null
  const crafts = CRAFT_TYPES.filter((c) => projects.some((p) => p.craft_type === c))
  const shown = projects.filter((p) => view.match(p) && (!craft || p.craft_type === craft))

  const byProject = new Map<string, typeof entries>()
  for (const e of entries) {
    const list = byProject.get(e.project_id) ?? []
    list.push(e)
    byProject.set(e.project_id, list)
  }
  const covers = new Map(shown.map((p) => [p.id, pickCover(p, byProject.get(p.id) ?? [])]))
  const signed = await signPhotos(supabase, Array.from(covers.values()))

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const hoursThisMonth = entries.filter((e) => new Date(e.logged_at) >= monthStart).reduce((s, e) => s + (Number(e.time_spent_hours) || 0), 0)
  const activeCount = projects.filter((p) => isActive(p.status)).length
  const finishedCount = projects.filter((p) => p.status === 'completed').length

  const href = (v: string, c: string | null) => {
    const q = new URLSearchParams()
    if (v !== 'active') q.set('view', v)
    if (c) q.set('craft', c)
    const s = q.toString()
    return s ? `/projects?${s}` : '/projects'
  }

  return (
    <>
      <PageHeader
        eyebrow={`Hey ${displayName(user)}`}
        title="Your projects"
        sub={
          projects.length ? (
            <>
              <span className="figure">{activeCount}</span> on the bench, <span className="figure">{finishedCount}</span> finished, and{' '}
              <span className="figure">{formatHours(hoursThisMonth)}</span> logged this month.
            </>
          ) : undefined
        }
        action={
          <Link href="/projects/new" className="btn-primary">
            <span aria-hidden>+</span> New project
          </Link>
        }
      />

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1" role="tablist" aria-label="Filter by status">
              {VIEWS.map((v) => {
                const count = projects.filter((p) => v.match(p) && (!craft || p.craft_type === craft)).length
                const active = v.key === view.key
                return (
                  <Link
                    key={v.key}
                    href={href(v.key, craft)}
                    role="tab"
                    aria-selected={active}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${active ? 'bg-ink text-white' : 'text-muted hover:bg-sunk hover:text-ink'}`}
                  >
                    {v.label} <span className={`figure ml-1 text-xs ${active ? 'text-white/70' : 'text-faint'}`}>{count}</span>
                  </Link>
                )
              })}
            </div>
            {crafts.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                <Link href={href(view.key, null)} className={`chip ${!craft ? 'border-ink bg-ink text-white' : 'hover:border-strong'}`}>
                  All crafts
                </Link>
                {crafts.map((c) => (
                  <Link key={c} href={href(view.key, c)} className={`chip ${craft === c ? 'border-ink bg-ink text-white' : 'hover:border-strong'}`}>
                    <CraftIcon craft={c} className="h-3.5 w-3.5" />
                    {CRAFT_LABELS[c]}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {shown.length === 0 ? (
            <div className="card px-6 py-14 text-center">
              <p className="heading text-xl">Nothing here yet</p>
              <p className="mt-2 text-sm text-muted">No projects match this filter.</p>
              <Link href="/projects?view=all" className="btn-ghost mt-5">
                Show everything
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((p) => {
                const cover = covers.get(p.id)
                return <ProjectCard key={p.id} project={p} coverUrl={cover ? signed[cover] ?? null : null} entryCount={byProject.get(p.id)?.length ?? 0} currency={currency} />
              })}
            </div>
          )}
        </>
      )}
    </>
  )
}

function EmptyState() {
  return (
    <div className="card overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
        <div className="p-8 sm:p-10">
          <p className="label">Start here</p>
          <h2 className="heading mt-2 text-2xl">What&rsquo;s on your bench right now?</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            Add the thing you&rsquo;re working on, even if it&rsquo;s half done. Log a session whenever you put time into it: a photo, a line about what you did, how long it took, what you bought.
            Next month you&rsquo;ll be glad you did.
          </p>
          <Link href="/projects/new" className="btn-primary mt-6">
            Add your first project
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-px border-t border-line bg-line md:border-l md:border-t-0">
          {CRAFT_TYPES.map((c) => (
            <div key={c} className="flex flex-col items-center justify-center gap-2 bg-surface px-2 py-6 text-center text-faint">
              <CraftIcon craft={c} className="h-6 w-6" />
              <span className="text-[0.68rem] leading-tight">{CRAFT_LABELS[c]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
