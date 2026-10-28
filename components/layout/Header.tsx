import { Logo } from './Logo'
import { NavLinks } from './nav'

// Phone chrome: a slim top bar and a bottom bar you can reach with a thumb,
// since most entries get logged at the bench with sawdust on one hand.
export function Header() {
  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-3 backdrop-blur md:hidden"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <Logo href="/projects" />
      </header>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface/95 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <NavLinks variant="bottom" />
      </nav>
    </>
  )
}
