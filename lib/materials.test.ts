import { describe, expect, it } from 'vitest'
import { parseMaterials } from './materials'
import { BadInput } from './validate'

describe('parseMaterials', () => {
  it('parses rows and rounds cost to cents', () => {
    expect(parseMaterials([{ name: ' PLA, black ', quantity: '1kg', cost: '24.999' }])).toEqual([{ name: 'PLA, black', quantity: '1kg', cost: 25 }])
  })

  it('skips blank rows from the form', () => {
    expect(parseMaterials([{ name: '', quantity: '', cost: '' }, { name: 'Glue', cost: 8 }])).toEqual([{ name: 'Glue', quantity: null, cost: 8 }])
  })

  it('defaults a missing cost to zero', () => {
    expect(parseMaterials([{ name: 'Offcut from the scrap bin' }])).toEqual([{ name: 'Offcut from the scrap bin', quantity: null, cost: 0 }])
  })

  it('rejects a cost without a name, negative costs and non lists', () => {
    expect(() => parseMaterials([{ name: '', cost: 5 }])).toThrow(BadInput)
    expect(() => parseMaterials([{ name: 'Wood', cost: -1 }])).toThrow(BadInput)
    expect(() => parseMaterials('wood')).toThrow(BadInput)
  })

  it('caps how many come in at once', () => {
    const many = Array.from({ length: 21 }, (_, i) => ({ name: `Item ${i}`, cost: 1 }))
    expect(() => parseMaterials(many)).toThrow(BadInput)
  })
})
