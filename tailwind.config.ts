import type { Config } from 'tailwindcss'

// Palette from the spec: warm off white background, white surfaces, a deep
// amber for actions, green for completed and blue for in progress. The stone
// neutrals in between keep it feeling like a workshop notebook, not an app.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAF9',
        surface: '#FFFFFF',
        sunk: '#F5F5F4',
        line: '#E7E5E4',
        strong: '#D6D3D1',
        ink: '#1C1917',
        muted: '#57534E',
        faint: '#78716C',
        primary: { DEFAULT: '#92400E', bright: '#B45309', dark: '#78350F', soft: '#FEF3C7', wash: '#FFFBEB' },
        completed: { DEFAULT: '#16A34A', ink: '#15803D', soft: '#DCFCE7' },
        progress: { DEFAULT: '#3B82F6', ink: '#1D4ED8', soft: '#DBEAFE' },
        planning: { DEFAULT: '#A8A29E', ink: '#57534E', soft: '#F5F5F4' },
        shelved: { DEFAULT: '#A8A29E', ink: '#78716C', soft: '#F5F5F4' },
        danger: { DEFAULT: '#B91C1C', soft: '#FEE2E2' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 25, 23, 0.04), 0 4px 16px -8px rgba(28, 25, 23, 0.08)',
        lift: '0 2px 4px rgba(28, 25, 23, 0.05), 0 16px 32px -16px rgba(28, 25, 23, 0.18)',
      },
      keyframes: {
        'rise-in': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
      },
      animation: {
        'rise-in': 'rise-in 0.3s ease-out both',
        shimmer: 'shimmer 1.8s linear infinite',
        scan: 'scan 1.6s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
}

export default config
