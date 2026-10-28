import Link from 'next/link'

export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#92400E" />
      <path d="M16 46h32" stroke="#FEF3C7" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 46v-5M26 46v-3M32 46v-5M38 46v-3M44 46v-5" stroke="#FEF3C7" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 34 34 16l8 5-12 18-9 2z" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  )
}

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="CraftLog home">
      <LogoMark />
      <span className="font-display text-lg font-semibold tracking-tight text-ink">CraftLog</span>
    </Link>
  )
}
