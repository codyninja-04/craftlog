import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { requireUser } from '@/lib/auth'
import { FREE_ACTIVE_PROJECTS, enforcingPlans } from '@/lib/plan'
import { CurrencyForm, DeleteAccount } from './SettingsForms'

export const metadata: Metadata = { title: 'Settings' }

const FREE = [`${FREE_ACTIVE_PROJECTS} active projects`, 'Unlimited finished projects', 'Log entries, photos, time and materials', 'Export everything']
const PRO = ['Unlimited active projects', 'Photo troubleshooting with Claude', 'Stats: hours, costs and progression', 'Everything in Free']

export default async function SettingsPage() {
  const { supabase, user, plan, currency } = await requireUser()
  const { count } = await supabase.from('craft_projects').select('id', { count: 'exact', head: true })
  const enforcing = enforcingPlans()

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" />

      <div className="space-y-6">
        <section className="card p-5 sm:p-6">
          <h2 className="heading text-lg">Account</h2>
          <p className="mt-1 text-sm text-muted">
            Signed in with Google as <span className="font-medium text-ink">{user.email}</span>
          </p>
          <form action="/auth/signout" method="post" className="mt-4">
            <button className="btn-ghost py-2">Sign out</button>
          </form>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="heading text-lg">Currency</h2>
          <p className="mb-4 mt-1 text-sm text-muted">How material costs are shown. Changing it doesn&rsquo;t convert amounts you&rsquo;ve already logged.</p>
          <CurrencyForm current={currency} />
        </section>

        <section id="plan" className="card scroll-mt-24 p-5 sm:p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="heading text-lg">Plan</h2>
            <span className="chip capitalize">{plan}</span>
          </div>
          {!enforcing && <p className="mt-2 rounded-xl bg-completed-soft/60 px-3 py-2 text-sm text-completed-ink">Billing isn&rsquo;t switched on yet, so everything is unlocked for now.</p>}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <PlanCard name="Free" price="$0" items={FREE} current={plan === 'free'} />
            <PlanCard name="Pro" price="$5 / month" items={PRO} current={plan === 'pro'} highlight />
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="heading text-lg">Your data</h2>
          <p className="mt-1 text-sm text-muted">Every project, entry, material and troubleshoot as one JSON file. Photos come as links that work for an hour.</p>
          <a href="/api/export" className="btn-ghost mt-4 py-2" download>
            Download export
          </a>
        </section>

        <section className="card border-danger/20 p-5 sm:p-6">
          <h2 className="heading mb-2 text-lg">Delete account</h2>
          <DeleteAccount projects={count ?? 0} />
        </section>
      </div>
    </div>
  )
}

function PlanCard({ name, price, items, current, highlight }: { name: string; price: string; items: string[]; current: boolean; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-primary/30 bg-primary-wash' : 'border-line'}`}>
      <div className="flex items-baseline justify-between">
        <p className="font-display text-lg font-semibold">{name}</p>
        <p className="figure text-sm text-muted">{price}</p>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm text-muted">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className={highlight ? 'text-primary' : 'text-faint'} aria-hidden>
              ✓
            </span>
            {i}
          </li>
        ))}
      </ul>
      {current && <p className="mt-3 text-xs font-semibold text-ink">Your current plan</p>}
    </div>
  )
}
