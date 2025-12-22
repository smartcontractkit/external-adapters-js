import { median } from '../../src/transport/shared/utils'

describe('GLV utils', () => {
  describe('median', () => {
    it('returns deterministic median for odd list', () => {
      expect(median([5, 1, 3])).toBe(3)
    })

    it('returns midpoint for even list', () => {
      expect(median([5, 10, 15, 20])).toBe(12.5)
    })
  })
})
