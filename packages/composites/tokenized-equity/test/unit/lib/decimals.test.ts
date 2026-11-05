import { scaleDecimals } from '../../../src/lib/decimals'

describe('scaleDecimals', () => {
  it('scales down with truncation', () => {
    expect(scaleDecimals(123456789n, 6, 2)).toBe(12345n)
  })

  it('scales up', () => {
    expect(scaleDecimals(12n, 2, 6)).toBe(120000n)
  })

  it('keeps value when decimals match', () => {
    expect(scaleDecimals(12n, 4, 4)).toBe(12n)
  })
})
