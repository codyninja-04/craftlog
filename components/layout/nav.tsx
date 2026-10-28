'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const NAV = [
  { href: '/projects', label: 'Projects', icon: 'bench' },
  { href: '/projects/new', label: 'New', icon: 'plus' },
  { href: '/stats', label: 'Stats', icon: 'chart' },
  { href: '/settings', label: 'Settings', icon: 'cog' },
] as const

type IconName = (typeof NAV)[number]['icon']

export function NavIcon({ name, className = 'h-[18px] w-[18px]' }: { name: IconName; className?: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...common}>
      {name === 'bench' && (
        <>
          <rect x="3" y="4" width="7" height="7" rx="1.5" />
          <rect x="14" y="4" width="7" height="7" rx="1.5" />
          <rect x="3" y="15" width="7" height="5" rx="1.5" />
          <rect x="14" y="15" width="7" height="5" rx="1.5" />
        </>
      )}
      {name === 'plus' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </>
      )}
      {name === 'chart' && <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />}
      {name === 'cog' && (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </>
      )}
    </svg>
  )
}

function useActive() {
  const path = usePathname()
  return (href: string) => {
    if (href === '/projects') return path === '/projects' || (path.startsWith('/projects/') && path !== '/projects/new')
    return path === href || path.startsWith(`${href}/`)
  }
}

export function NavLinks({ variant }: { variant: 'side' | 'bottom' }) {
  const isActive = useActive()
  return (
    <>
      {NAV.map((item) => {
        const active = isActive(item.href)
        if (variant === 'bottom') {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.68rem] font-semibold tracking-wide transition ${
                active ? 'text-primary' : 'text-faint hover:text-ink'
              }`}
            >
              <NavIcon name={item.icon} className="h-5 w-5" />
              {item.label}
            </Link>
          )
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? 'bg-primary-soft/70 text-primary-dark' : 'text-muted hover:bg-sunk hover:text-ink'
            }`}
          >
            <NavIcon name={item.icon} />
            {item.label === 'New' ? 'New project' : item.label}
          </Link>
        )
      })}
    </>
  )
}
