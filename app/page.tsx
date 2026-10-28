import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import { SampleLog } from '@/components/marketing/SampleLog'
import { CraftIcon } from '@/components/projects/CraftIcon'
import { CRAFT_LABELS } from '@/lib/crafts'
import { FREE_ACTIVE_PROJECTS } from '@/lib/plan'
import { createClient } from '@/lib/supabase/server'
import { CRAFT_TYPES } from '@/lib/types'

const FEATURES = [
  {
    title: 'Log a session in seconds',
    body: 'A photo, a line about what you did, how long it took. Mark the big moments as milestones so they stand out later.',
    icon: 'M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  },
  {
    title: 'Know what a build really cost',
    body: 'Every spool, board and skein adds up to a real number per project, alongside the hours you put in.',
    icon: 'M12 3v18M17 7.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2.2 2.6 5 3.3 5 1.6 5 3.6-2.2 3.1-5 3.1-5-1.2-5-3.1',
  },
  {
    title: 'A second opinion on what went wrong',
    body: 'Warping, tear out, gauge that won’t match. Snap the problem, describe it, get the likely cause and fixes in the order worth trying.',
    icon: 'M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.2-4.2M11 8v3.5M11 14h.01',
  },
  {
    title: 'See yourself getting better',
    body: 'Hours per month, cost by craft, and your finished builds side by side. The fixes that worked collect into your own notebook.',
    icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  },
]

export default async function Home() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-2">
          {user ? (
            <Link href="/projects" className="btn-primary py-2">
              Open your log
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-quiet py-2">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary py-2">
                Start free
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div className="animate-rise-in">
            <p className="label">For woodworkers, knitters, printers and anyone who makes things</p>
            <h1 className="heading mt-4 text-5xl leading-[1.02] sm:text-6xl">
              The build log your <span className="text-primary">workbench</span> deserves.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Track the hours, the materials and the progress photos for every project. When a print warps or the gauge is off, show CraftLog a photo and get a straight answer on what to try next.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={user ? '/projects' : '/signup'} className="btn-primary px-6 py-3 text-base">
                {user ? 'Open your log' : 'Start your log'}
              </Link>
              <span className="text-sm text-faint">Free for {FREE_ACTIVE_PROJECTS} active projects. No card.</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-primary-soft/40 blur-2xl" aria-hidden />
            <SampleLog className="shadow-lift lg:rotate-1" />
          </div>
        </section>

        <section className="border-y border-line bg-surface/80">
          <div className="mx-auto grid max-w-6xl grid-cols-4 gap-px bg-line sm:grid-cols-8">
            {CRAFT_TYPES.map((c) => (
              <div key={c} className="flex flex-col items-center gap-2 bg-surface px-2 py-5 text-center text-muted">
                <CraftIcon craft={c} className="h-6 w-6" />
                <span className="text-[0.7rem] leading-tight">{CRAFT_LABELS[c]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="max-w-2xl">
            <p className="label">What it does</p>
            <h2 className="heading mt-3 text-3xl sm:text-4xl">Less time remembering, more time making.</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={f.icon} />
                  </svg>
                </span>
                <h3 className="heading mt-4 text-xl">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
          <div className="card grid gap-8 overflow-hidden p-8 sm:p-10 md:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="label">Pricing</p>
              <h2 className="heading mt-3 text-3xl">Free to start. $5 a month if it earns its place.</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Free covers {FREE_ACTIVE_PROJECTS} projects on the go at once, with unlimited finished ones. Pro adds unlimited projects, photo troubleshooting and the stats page.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-3">
              <Link href={user ? '/projects' : '/signup'} className="btn-primary py-3">
                {user ? 'Open your log' : 'Start free with Google'}
              </Link>
              <p className="text-center text-xs text-faint">Your projects and photos stay private to your account.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="ruler mx-auto h-3 max-w-6xl opacity-60" aria-hidden />
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-faint sm:flex-row sm:justify-between sm:px-8">
          <span>CraftLog. Made for people who make things.</span>
          <span>No marketplace, no ads. Just your log.</span>
        </div>
      </footer>
    </div>
  )
}
