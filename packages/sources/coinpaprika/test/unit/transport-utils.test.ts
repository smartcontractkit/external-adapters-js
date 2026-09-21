import { isPriceInvariantViolated } from '../../src/transport/utils'

describe('isPriceInvariantViolated', () => {
  it('returns false when bid < price < ask', () => {
    expect(isPriceInvariantViolated(100, 100.5, 101)).toBe(false)
  })

  it('returns true when price equals bid', () => {
    expect(isPriceInvariantViolated(100, 100, 101)).toBe(true)
  })

  it('returns true when price equals ask', () => {
    expect(isPriceInvariantViolated(100, 101, 101)).toBe(true)
  })

  it('returns true when price is below bid', () => {
    expect(isPriceInvariantViolated(100, 99.5, 101)).toBe(true)
  })

  it('returns true when price is above ask', () => {
    expect(isPriceInvariantViolated(100, 101.5, 101)).toBe(true)
  })

  it('returns true on a crossed market (bid > ask)', () => {
    expect(isPriceInvariantViolated(101, 100.5, 100)).toBe(true)
  })
})
