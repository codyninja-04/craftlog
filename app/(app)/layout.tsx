import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { displayName, requireUser } from '@/lib/auth'
import { limitsFor } from '@/lib/plan'
import { countActive } from '@/lib/projects'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, plan } = await requireUser()
  const limit = limitsFor(plan).activeProjects
  const active = Number.isFinite(limit) ? await countActive(supabase, user.id) : 0

  return (
    <div className="flex min-h-screen">
      <Sidebar name={displayName(user)} plan={plan} activeCount={active} activeLimit={Number.isFinite(limit) ? limit : null} />
      <div className="min-w-0 flex-1">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-16 md:pt-10">{children}</main>
      </div>
    </div>
  )
}
