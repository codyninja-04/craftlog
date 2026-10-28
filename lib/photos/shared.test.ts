import { describe, expect, it } from 'vitest'
import { fitWithin, isOwnPhotoPath } from './shared'

const USER = '11111111-1111-1111-1111-111111111111'
const PROJECT = '22222222-2222-2222-2222-222222222222'

describe('fitWithin', () => {
  it('shrinks the long edge to the limit', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1600, height: 1200 })
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: 1600 })
  })

  it('never upscales', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })
})

describe('isOwnPhotoPath', () => {
  it('accepts a photo inside the project folder', () => {
    expect(isOwnPhotoPath(`${USER}/${PROJECT}/abc.jpg`, USER, PROJECT)).toBe(true)
  })

  it('rejects other folders, traversal and non images', () => {
    expect(isOwnPhotoPath(`someone-else/${PROJECT}/abc.jpg`, USER, PROJECT)).toBe(false)
    expect(isOwnPhotoPath(`${USER}/other-project/abc.jpg`, USER, PROJECT)).toBe(false)
    expect(isOwnPhotoPath(`${USER}/${PROJECT}/../../x.jpg`, USER, PROJECT)).toBe(false)
    expect(isOwnPhotoPath(`${USER}/${PROJECT}/notes.txt`, USER, PROJECT)).toBe(false)
    expect(isOwnPhotoPath(42, USER, PROJECT)).toBe(false)
  })
})
