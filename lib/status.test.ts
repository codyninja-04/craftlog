import { describe, expect, it } from 'vitest'
import { becomesActive, statusDates } from './status'

const TODAY = '2026-10-28'

describe('statusDates', () => {
  it('stamps start and finish when completing a fresh project', () => {
    expect(statusDates({ status: 'planning', started_at: null, completed_at: null }, 'completed', TODAY)).toEqual({ started_at: TODAY, completed_at: TODAY })
  })

  it('keeps a start date the user already set', () => {
    expect(statusDates({ status: 'in_progress', started_at: '2026-09-01', completed_at: null }, 'completed', TODAY)).toEqual({ completed_at: TODAY })
  })

  it('clears the finish date when reopening', () => {
    expect(statusDates({ status: 'completed', started_at: '2026-09-01', completed_at: '2026-10-01' }, 'in_progress', TODAY)).toEqual({ completed_at: null })
  })

  it('does nothing when the status is unchanged', () => {
    expect(statusDates({ status: 'in_progress', started_at: null, completed_at: null }, 'in_progress', TODAY)).toEqual({})
  })

  it("doesn't start the clock on a shelved project", () => {
    expect(statusDates({ status: 'planning', started_at: null, completed_at: null }, 'abandoned', TODAY)).toEqual({})
  })
})

describe('becomesActive', () => {
  it('counts new active projects and reopened ones', () => {
    expect(becomesActive(null, 'in_progress')).toBe(true)
    expect(becomesActive(null, 'planning')).toBe(true)
    expect(becomesActive('completed', 'in_progress')).toBe(true)
    expect(becomesActive('abandoned', 'planning')).toBe(true)
  })

  it('ignores moves that keep the active count the same or lower it', () => {
    expect(becomesActive('planning', 'in_progress')).toBe(false)
    expect(becomesActive('in_progress', 'completed')).toBe(false)
    expect(becomesActive(null, 'completed')).toBe(false)
  })
})
