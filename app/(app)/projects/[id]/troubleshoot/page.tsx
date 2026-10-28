import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { CraftIcon } from '@/components/projects/CraftIcon'
import { TroubleshootForm } from '@/components/troubleshoot/TroubleshootForm'
import { TroubleshootResult } from '@/components/troubleshoot/TroubleshootResult'
import { requireUser } from '@/lib/auth'
import { claudeAvailable } from '@/lib/claude/client'
import { CRAFT_LABELS } from '@/lib/crafts'
import { limitsFor } from '@/lib/plan'
import { signPhotos } from '@/lib/photos/server'
import { getProjectBundle } from '@/lib/projects'
import { UUID } from '@/lib/validate'

export const metadata: Metadata = { title: 'Troubleshoot' }

export default async function TroubleshootPage({ params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) notFound()
  const { supabase, plan } = await requireUser()
  const bundle = await getProjectBundle(supabase, params.id)
  if (!bundle) notFound()

  const { project, entries, sessions } = bundle
  const logPhotoPaths = entries.filter((e) => e.photo_url).map((e) => e.photo_url!)
  const photoUrls = await signPhotos(supabase, [...logPhotoPaths, ...sessions.map((s) => s.photo_url)])
  const logPhotos = logPhotoPaths.filter((p) => photoUrls[p]).map((path) => ({ path, url: photoUrls[path] }))

  const allowed = limitsFor(plan).troubleshoot
  const configured = claudeAvailable()

  return (
    <div className="animate-rise-in">
      <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <span aria-hidden>←</span> {project.name}
      </Link>
      <div className="mt-4">
        <PageHeader
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <CraftIcon craft={project.craft_type} className="h-3.5 w-3.5" /> {CRAFT_LABELS[project.craft_type]}
            </span>
          }
          title="Troubleshoot an issue"
          sub="Show what went wrong and describe it. You'll get the most likely cause and a short list of fixes to try, cheapest first."
        />
      </div>

      {!allowed ? (
        <div className="space-y-8">
          <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="heading text-lg">Troubleshooting is part of Pro</p>
              <p className="mt-1 text-sm text-muted">Pro is $5 a month and adds unlimited projects, photo troubleshooting and the stats page.</p>
            </div>
            <Link href="/settings#plan" className="btn-primary shrink-0">
              See Pro
            </Link>
          </div>
          {sessions.length > 0 && (
            <div className="space-y-5">
              {sessions.map((s) => (
                <TroubleshootResult key={s.id} session={s} photoUrl={s.photo_url ? photoUrls[s.photo_url] : undefined} />
              ))}
            </div>
          )}
        </div>
      ) : !configured ? (
        <div className="card p-6 text-sm text-muted">
          Troubleshooting needs an <code className="rounded bg-sunk px-1 font-mono text-xs">ANTHROPIC_API_KEY</code> on the server. Add it to the environment and redeploy.
        </div>
      ) : (
        <TroubleshootForm projectId={project.id} craft={project.craft_type} sessions={sessions} logPhotos={logPhotos} photoUrls={photoUrls} />
      )}
    </div>
  )
}
