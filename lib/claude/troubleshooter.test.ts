import { describe, expect, it } from 'vitest'
import { buildPrompt, parseDiagnosis, type TroubleshootContext } from './troubleshooter'

describe('parseDiagnosis', () => {
  it('cleans up a good tool call', () => {
    const d = parseDiagnosis({
      diagnosis: '  Warping at the corners.\n\nClassic bed adhesion.  ',
      likely_causes: ['Bed too cool', '', 'Draught'],
      suggested_fixes: ['Clean the bed with IPA', 'Add a 5mm brim'],
      confidence: 'high',
      needs_better_photo: false,
    })
    expect(d).toEqual({
      diagnosis: 'Warping at the corners. Classic bed adhesion.',
      likely_causes: ['Bed too cool', 'Draught'],
      suggested_fixes: ['Clean the bed with IPA', 'Add a 5mm brim'],
      confidence: 'high',
      needs_better_photo: false,
    })
  })

  it('treats an unknown confidence as low', () => {
    expect(parseDiagnosis({ diagnosis: 'Hard to say.', suggested_fixes: ['Retake the photo'], confidence: 'certain' })?.confidence).toBe('low')
  })

  it('rejects answers without a diagnosis or any fixes', () => {
    expect(parseDiagnosis({ diagnosis: '', suggested_fixes: ['x fix'] })).toBeNull()
    expect(parseDiagnosis({ diagnosis: 'Something', suggested_fixes: [] })).toBeNull()
    expect(parseDiagnosis(null)).toBeNull()
  })

  it('caps the number of fixes', () => {
    const d = parseDiagnosis({ diagnosis: 'Lots to try.', suggested_fixes: Array.from({ length: 12 }, (_, i) => `Fix number ${i}`), confidence: 'medium' })
    expect(d?.suggested_fixes).toHaveLength(8)
  })
})

describe('buildPrompt', () => {
  const ctx: TroubleshootContext = {
    craftType: '3d_printing',
    projectName: 'Benchy',
    projectNotes: 'Ender 3, PLA at 205',
    recentEntries: ['2026-10-27: first layer looked fine'],
    earlierAttempts: [{ problem: 'Stringing', fixes: ['Raise retraction to 6mm'], resolved: true, note: 'Dried the filament' }],
  }

  it('includes the project context and fences user text', () => {
    const p = buildPrompt('Corners lift', ctx, true)
    expect(p).toContain('Craft: 3D printing')
    expect(p).toContain('<notes>\nEnder 3, PLA at 205\n</notes>')
    expect(p).toContain('<problem>\nCorners lift\n</problem>')
    expect(p).toContain('Solved: Dried the filament')
    expect(p).toContain('The photo above shows the problem')
  })

  it('says when there is no photo', () => {
    expect(buildPrompt('Gauge is off', { ...ctx, projectNotes: null, recentEntries: [], earlierAttempts: [] }, false)).toContain('There is no photo')
  })
})
