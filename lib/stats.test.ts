import { describe, expect, it } from 'vitest'
import { activeWeeks, craftBreakdown, monthlyHours, progression, totals } from './stats'
import type { Project } from './types'

function project(over: Partial<Project>): Project {
  return {
    id: 'p',
    user_id: 'u',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    name: 'Thing',
    description: null,
    craft_type: 'woodworking',
    status: 'in_progress',
    cover_photo_url: null,
    total_time_hours: 0,
    total_material_cost: 0,
    started_at: null,
    completed_at: null,
    ...over,
  }
}

const projects = [
  project({ id: 'a', craft_type: 'woodworking', status: 'completed', total_time_hours: 10, total_material_cost: 100, started_at: '2026-03-01', completed_at: '2026-03-10' }),
  project({ id: 'b', craft_type: 'woodworking', status: 'completed', total_time_hours: 6, total_material_cost: 50, started_at: '2026-06-01', completed_at: '2026-06-03' }),
  project({ id: 'c', craft_type: '3d_printing', status: 'abandoned', total_time_hours: 2, total_material_cost: 20 }),
  project({ id: 'd', craft_type: 'knitting_crochet', status: 'in_progress', total_time_hours: 4.25 }),
]

describe('craftBreakdown', () => {
  it('sums by craft in the fixed craft order', () => {
    const rows = craftBreakdown(projects)
    expect(rows.map((r) => r.craft)).toEqual(['woodworking', 'knitting_crochet', '3d_printing'])
    expect(rows[0]).toEqual({ craft: 'woodworking', projects: 2, completed: 2, hours: 16, cost: 150 })
  })
})

describe('totals', () => {
  it('works out the headline numbers', () => {
    const t = totals(projects)
    expect(t.projects).toBe(4)
    expect(t.completed).toBe(2)
    expect(t.hours).toBe(22.3)
    expect(t.avgHoursPerFinished).toBe(8)
    expect(t.finishRate).toBe(67)
  })

  it('leaves rates empty when nothing has ended', () => {
    expect(totals([project({})]).finishRate).toBeNull()
  })
})

describe('monthlyHours', () => {
  const now = new Date(2026, 9, 28)
  const craftOf = (id: string) => projects.find((p) => p.id === id)?.craft_type

  it('keeps 12 buckets and drops entries outside them', () => {
    const months = monthlyHours(
      [
        { project_id: 'a', logged_at: new Date(2026, 9, 2).toISOString(), time_spent_hours: 2 },
        { project_id: 'd', logged_at: new Date(2026, 9, 20).toISOString(), time_spent_hours: 1.5 },
        { project_id: 'a', logged_at: new Date(2024, 0, 1).toISOString(), time_spent_hours: 5 },
        { project_id: 'a', logged_at: new Date(2026, 9, 3).toISOString(), time_spent_hours: null },
      ],
      craftOf,
      12,
      now,
    )
    expect(months).toHaveLength(12)
    expect(months[11].key).toBe('2026-10')
    expect(months[11].hours).toEqual({ woodworking: 2, knitting_crochet: 1.5 })
    expect(months[11].total).toBe(3.5)
    expect(months.slice(0, 11).every((m) => m.total === 0)).toBe(true)
  })
})

describe('progression', () => {
  it('lists finished projects oldest first with their duration', () => {
    const p = progression(projects)
    expect(p.map((x) => x.id)).toEqual(['a', 'b'])
    expect(p[0].days).toBe(10)
  })
})

describe('activeWeeks', () => {
  const now = new Date(2026, 9, 28) // a Wednesday
  const at = (y: number, m: number, d: number) => ({ project_id: 'a', logged_at: new Date(y, m, d, 12).toISOString(), time_spent_hours: 1 })

  it('counts consecutive weeks back from this week', () => {
    expect(activeWeeks([at(2026, 9, 27), at(2026, 9, 20), at(2026, 9, 13), at(2026, 8, 1)], now)).toBe(3)
  })

  it('still counts a run that ended last week', () => {
    expect(activeWeeks([at(2026, 9, 21), at(2026, 9, 14)], now)).toBe(2)
  })

  it('is zero after a gap', () => {
    expect(activeWeeks([at(2026, 9, 1)], now)).toBe(0)
  })
})
