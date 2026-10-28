import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CoverArt } from '@/components/projects/CoverArt'
import { CraftIcon } from '@/components/projects/CraftIcon'
import { LogEntryForm } from '@/components/projects/LogEntryForm'
import { LogTimeline } from '@/components/projects/LogTimeline'
import { MaterialsCostTracker } from '@/components/projects/MaterialsCostTracker'
import { ProgressPhotoGrid } from '@/components/projects/ProgressPhotoGrid'
import { ProjectControls } from '@/components/projects/ProjectControls'
import { StatusBadge } from '@/components/projects/StatusBadge'
import { requireUser } from '@/lib/auth'
import { CRAFT_LABELS } from '@/lib/crafts'
import { daysBetween, formatDate, formatHours, formatMoney, today } from '@/lib/format'
import { signPhotos } from '@/lib/photos/server'
import { getProject, getProjectBundle, pickCover } from '@/lib/projects'
import { UUID } from '@/lib/validate'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!UUID.test(params.id)) return { title: 'Project' }
  const { supabase } = await requireUser()
  const project = await getProject(supabase, params.id)
  return { title: project?.name ?? 'Project' }
}

export default async function ProjectPage({ params }: Props) {
  if (!UUID.test(params.id)) notFound()
  const { supabase, currency } = await requireUser()
  const bundle = await getProjectBundle(supabase, params.id)
  if (!bundle) notFound()

  const { project, entries, materials, sessions } = bundle
  const coverPath = pickCover(project, entries)
  const photos = await signPhotos(supabase, [coverPath, ...entries.map((e) => e.photo_url)])

  const days = daysBetween(project.started_at, project.completed_at ?? (project.started_at ? today() : null))
  const sessionsWithTime = entries.filter((e) => (e.time_spent_hours ?? 0) > 0).length
  const openIssues = sessions.filter((s) => !s.resolved)

  return (
    <div className="animate-rise-in">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <span aria-hidden>←</span> All projects
      </Link>

      <section className="card mt-4 overflow-hidden">
        <div className="grid md:grid-cols-[minmax(0,22rem)_1fr]">
          <CoverArt src={coverPath ? photos[coverPath] : null} craft={project.craft_type} alt={project.name} className="aspect-[4/3] md:aspect-auto md:min-h-full" />
          <div className="flex flex-col p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="label inline-flex items-center gap-1.5">
                <CraftIcon craft={project.craft_type} className="h-3.5 w-3.5" />
                {CRAFT_LABELS[project.craft_type]}
              </span>
              <StatusBadge status={project.status} />
            </div>
            <h1 className="heading mt-2 text-3xl leading-tight sm:text-4xl">{project.name}</h1>
            {project.description && <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-muted">{project.description}</p>}

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-line py-4 sm:grid-cols-4">
              <Figure label="Time in" value={formatHours(project.total_time_hours)} sub={sessionsWithTime ? `${sessionsWithTime} timed ${sessionsWithTime === 1 ? 'session' : 'sessions'}` : undefined} />
              <Figure label="Materials" value={formatMoney(project.total_material_cost, currency)} sub={materials.length ? `${materials.length} ${materials.length === 1 ? 'item' : 'items'}` : undefined} />
              <Figure label="Entries" value={String(entries.length)} sub={entries.filter((e) => e.is_milestone).length ? `${entries.filter((e) => e.is_milestone).length} milestones` : undefined} />
              <Figure
                label={project.status === 'completed' ? 'Took' : 'On the bench'}
                value={days ? `${days} ${days === 1 ? 'day' : 'days'}` : 'Not started'}
                sub={project.started_at ? `from ${formatDate(project.started_at, { day: 'numeric', month: 'short' })}${project.completed_at ? ` to ${formatDate(project.completed_at, { day: 'numeric', month: 'short' })}` : ''}` : undefined}
              />
            </dl>

            <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <ProjectControls project={project} />
              <Link href={`/projects/${project.id}/troubleshoot`} className="btn-primary self-start">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m20 20-4.2-4.2M11 8v3.5M11 14h.01" />
                </svg>
                Troubleshoot an issue
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="log-heading" className="min-w-0">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="log-heading" className="heading text-xl">
              Build log
            </h2>
            {entries.length > 0 && <span className="text-xs text-faint">Newest first</span>}
          </div>
          <div className="space-y-6">
            <LogEntryForm projectId={project.id} currency={currency} />
            <LogTimeline entries={entries} materials={materials} photos={photos} currency={currency} />
          </div>
        </section>

        <aside className="space-y-6">
          {sessions.length > 0 && (
            <section className="card p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="heading text-lg">Troubleshooting</h2>
                <Link href={`/projects/${project.id}/troubleshoot`} className="text-xs font-semibold text-primary hover:underline">
                  Open
                </Link>
              </div>
              <p className="mt-1 text-xs text-muted">
                {openIssues.length ? `${openIssues.length} open, ` : ''}
                {sessions.length - openIssues.length} solved
              </p>
              <ul className="mt-3 space-y-2">
                {sessions.slice(0, 3).map((s) => (
                  <li key={s.id}>
                    <Link href={`/projects/${project.id}/troubleshoot#${s.id}`} className="flex items-start gap-2 rounded-lg p-2 text-sm hover:bg-sunk">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${s.resolved ? 'bg-completed' : 'border border-primary'}`} aria-hidden />
                      <span className="line-clamp-2 text-ink/90">{s.problem_description}</span>
                      <span className="sr-only">{s.resolved ? 'Solved' : 'Open'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <MaterialsCostTracker projectId={project.id} materials={materials} total={project.total_material_cost} currency={currency} />
          <ProgressPhotoGrid projectId={project.id} entries={entries} photos={photos} coverPath={coverPath} />
        </aside>
      </div>
    </div>
  )
}

function Figure({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="figure mt-1 text-xl font-semibold text-ink">{value}</dd>
      {sub && <dd className="mt-0.5 text-xs text-faint">{sub}</dd>}
    </div>
  )
}
