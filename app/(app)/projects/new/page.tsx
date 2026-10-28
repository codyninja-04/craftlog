import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { requireUser } from '@/lib/auth'
import { limitsFor } from '@/lib/plan'
import { countActive } from '@/lib/projects'

export const metadata: Metadata = { title: 'New project' }

export default async function NewProjectPage() {
  const { supabase, user, plan } = await requireUser()
  const limit = limitsFor(plan).activeProjects
  const atLimit = Number.isFinite(limit) && (await countActive(supabase, user.id)) >= limit

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="New project" title="Put it on the bench" sub="You can change any of this later. The only thing you need right now is a name." />
      {atLimit && (
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary-wash px-4 py-3 text-sm text-primary-dark">
          You have {limit} active projects, which is the free limit. You can still add one you&rsquo;ve already finished, or{' '}
          <Link href="/settings#plan" className="font-semibold underline underline-offset-2">
            go Pro
          </Link>{' '}
          for unlimited.
        </div>
      )}
      <div className="card p-6 sm:p-8">
        <ProjectForm />
      </div>
    </div>
  )
}
