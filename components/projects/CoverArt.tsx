import { CRAFT_COLORS } from '@/lib/crafts'
import type { CraftType } from '@/lib/types'
import { CraftIcon } from './CraftIcon'

// What a project shows before it has a photo: its craft drawn large on a dot
// grid, with a ruler along the bottom edge.
export function CoverArt({ src, craft, alt, className = '' }: { src?: string | null; craft: CraftType; alt: string; className?: string }) {
  if (src) {
    return (
      <div className={`relative overflow-hidden bg-sunk ${className}`}>
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      </div>
    )
  }
  return (
    <div className={`relative overflow-hidden bg-primary-wash ${className}`} aria-hidden>
      <div
        className="absolute inset-0 opacity-60"
        style={{ backgroundImage: 'radial-gradient(rgba(146, 64, 14, 0.18) 1px, transparent 1px)', backgroundSize: '14px 14px' }}
      />
      <div className="absolute inset-0 flex items-center justify-center" style={{ color: CRAFT_COLORS[craft] }}>
        <CraftIcon craft={craft} className="h-14 w-14 opacity-50" />
      </div>
      <div className="ruler absolute inset-x-0 bottom-0 h-3" />
    </div>
  )
}
