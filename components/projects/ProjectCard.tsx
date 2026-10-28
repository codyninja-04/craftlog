import Link from 'next/link'
import { CRAFT_LABELS } from '@/lib/crafts'
import { formatDate, formatHours, formatMoney } from '@/lib/format'
import type { Project } from '@/lib/types'
import { CoverArt } from './CoverArt'
import { CraftIcon } from './CraftIcon'
import { StatusBadge } from './StatusBadge'

export function ProjectCard({ project, coverUrl, entryCount, currency }: { project: Project; coverUrl: string | null; entryCount: number; currency: string }) {
  const dimmed = project.status === 'abandoned'
  return (
    <Link
      href={`/projects/${project.id}`}
      className={`card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-strong hover:shadow-lift ${dimmed ? 'opacity-75' : ''}`}
    >
      <div className="relative">
        <CoverArt src={coverUrl} craft={project.craft_type} alt={project.name} className="aspect-[4/3] w-full" />
        <StatusBadge status={project.status} className="absolute left-3 top-3 shadow-sm" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="label inline-flex items-center gap-1.5">
          <CraftIcon craft={project.craft_type} className="h-3.5 w-3.5" />
          {CRAFT_LABELS[project.craft_type]}
        </span>
        <h3 className="heading mt-1.5 line-clamp-2 text-lg leading-snug group-hover:text-primary-dark">{project.name}</h3>
        <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-3 text-sm">
          <div>
            <dt className="label">Time</dt>
            <dd className="figure mt-0.5 font-medium">{formatHours(project.total_time_hours)}</dd>
          </div>
          <div>
            <dt className="label">Cost</dt>
            <dd className="figure mt-0.5 font-medium">{formatMoney(project.total_material_cost, currency)}</dd>
          </div>
          <div>
            <dt className="label">Entries</dt>
            <dd className="figure mt-0.5 font-medium">{entryCount}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-faint">
          {project.status === 'completed' && project.completed_at ? `Finished ${formatDate(project.completed_at)}` : `Updated ${formatDate(project.updated_at)}`}
        </p>
      </div>
    </Link>
  )
}
