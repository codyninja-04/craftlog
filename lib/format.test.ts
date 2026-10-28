import { describe, expect, it } from 'vitest'
import { daysBetween, formatHours, formatMoney, parseDuration } from './format'

describe('parseDuration', () => {
  it('reads the formats people actually type', () => {
    expect(parseDuration('2')).toBe(2)
    expect(parseDuration('1.5')).toBe(1.5)
    expect(parseDuration('1:30')).toBe(1.5)
    expect(parseDuration('90m')).toBe(1.5)
    expect(parseDuration('1h 30m')).toBe(1.5)
    expect(parseDuration('2h')).toBe(2)
    expect(parseDuration('45 min')).toBe(0.75)
    expect(parseDuration('3 hours')).toBe(3)
  })

  it('returns null for junk', () => {
    expect(parseDuration('')).toBeNull()
    expect(parseDuration('soon')).toBeNull()
    expect(parseDuration('1:75')).toBeNull()
    expect(parseDuration('-2')).toBeNull()
  })

  it('round trips with formatHours', () => {
    for (const h of [0.25, 0.5, 1, 1.75, 2, 3.5]) expect(parseDuration(formatHours(h))).toBeCloseTo(h)
  })
})

describe('formatHours', () => {
  it('shows hours and minutes', () => {
    expect(formatHours(0)).toBe('0h')
    expect(formatHours(0.5)).toBe('30m')
    expect(formatHours(2)).toBe('2h')
    expect(formatHours(14.5)).toBe('14h 30m')
  })
})

describe('formatMoney', () => {
  it('drops cents on whole amounts', () => {
    expect(formatMoney(186, 'USD')).toBe('$186')
    expect(formatMoney(12.5, 'USD')).toBe('$12.50')
  })

  it('falls back when the currency code is bad', () => {
    expect(formatMoney(5, 'NOPE')).toBe('NOPE 5.00')
  })
})

describe('daysBetween', () => {
  it('counts both ends', () => {
    expect(daysBetween('2026-10-01', '2026-10-01')).toBe(1)
    expect(daysBetween('2026-10-01', '2026-10-10')).toBe(10)
  })

  it('handles missing or backwards dates', () => {
    expect(daysBetween(null, '2026-10-01')).toBeNull()
    expect(daysBetween('2026-10-05', '2026-10-01')).toBeNull()
  })
})
