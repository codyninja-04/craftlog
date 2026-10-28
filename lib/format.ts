// Hours are stored as decimals. People think in hours and minutes.
export function formatHours(hours: number): string {
  if (!hours || hours <= 0) return '0h'
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatMoney(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  if (!iso) return ''
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', opts)
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

// Inclusive day count, so a project started and finished today took 1 day.
export function daysBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null
  const a = new Date(`${start.slice(0, 10)}T00:00:00Z`).getTime()
  const b = new Date(`${end.slice(0, 10)}T00:00:00Z`).getTime()
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null
  return Math.round((b - a) / 86_400_000) + 1
}

// Accepts "2", "1.5", "1:30", "90m", "1h 30m", "2h". Returns hours or null.
export function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase()
  if (!s) return null
  const clock = s.match(/^(\d+):([0-5]\d)$/)
  if (clock) return Number(clock[1]) + Number(clock[2]) / 60
  const hm = s.match(/^(?:(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?)?\s*(?:(\d+)\s*m(?:in(?:ute)?s?)?)?$/)
  if (hm && (hm[1] || hm[2])) return Number(hm[1] ?? 0) + Number(hm[2] ?? 0) / 60
  const plain = Number(s)
  return Number.isFinite(plain) && plain >= 0 ? plain : null
}

export function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
