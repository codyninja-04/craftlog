import type { CraftType } from '@/lib/types'

// Simple line drawings, one per craft. Used on cards, filters and empty covers.
export function CraftIcon({ craft, className = 'h-5 w-5' }: { craft: CraftType; className?: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...common}>
      {craft === 'woodworking' && (
        <>
          <path d="M3 17 15 5l4 4L7 21H3z" />
          <path d="M12 8l4 4M6 14l1 1M8 12l1 1M10 10l1 1" />
        </>
      )}
      {craft === 'knitting_crochet' && (
        <>
          <circle cx="11" cy="13" r="7" />
          <path d="M5.5 9.5c3 1 7 1 11.5-.5M4.5 14c3.5 1 8 1 13-1M7 18.5c2.5-3 4-8 3.5-12.5M13 20c1-3 1.5-7 0-12.5" />
          <path d="M17 6l4-4" />
        </>
      )}
      {craft === '3d_printing' && (
        <>
          <path d="M4 3h16M12 3v4" />
          <path d="M9 7h6l-1.5 4h-3z" />
          <path d="M5 21h14M6 18h12M7 15h10" />
        </>
      )}
      {craft === 'model_building' && (
        <>
          <path d="M12 3 4 7.5v9L12 21l8-4.5v-9z" />
          <path d="M4 7.5 12 12l8-4.5M12 12v9" />
        </>
      )}
      {craft === 'sewing' && (
        <>
          <path d="M19 3 6 16" />
          <path d="M17.5 2.5a1.5 1.5 0 1 1 2 2" />
          <path d="M6 16c-2 1-3 3-2 4.5s3.5 0 4-2c.6-2.4-1-3.5 2-5 2.5-1.2 5 0 8-1" />
        </>
      )}
      {craft === 'pottery' && (
        <>
          <path d="M8 3h8M9 3c0 3-4 5-4 10 0 4.5 3 8 7 8s7-3.5 7-8c0-5-4-7-4-10" />
          <path d="M6 12h12" />
        </>
      )}
      {craft === 'electronics' && (
        <>
          <rect x="6" y="6" width="12" height="12" rx="2" />
          <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
          <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
        </>
      )}
      {craft === 'other' && (
        <>
          <path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L3 18l3 3 6.2-6.2a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.2-.6-.6-2.2z" />
        </>
      )}
    </svg>
  )
}
