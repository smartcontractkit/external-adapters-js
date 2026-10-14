import { processOvernightUpdate, TIMEOUT_MS } from '../../../../src/lib/smoother/overnightSmoother'

describe('processOvernightUpdate', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    jest.setSystemTime(new Date('2024-01-16T02:00:00Z').getTime())
  })

  it('is a no-op pass-through when not overnight', () => {
    const result = processOvernightUpdate('night1', 1000n, false)
    expect(result).toEqual({ price: 1000n, x: 0n, p: 0 })
  })

  it('does not advance the filter while not overnight', () => {
    // Warm the filter up while overnight.
    processOvernightUpdate('night2', 1000n, true)
    jest.setSystemTime(Date.now() + 1000)
    const warm = processOvernightUpdate('night2', 1000n, true)

    // A tick outside the overnight session must not feed it, even with a wildly
    // different price.
    jest.setSystemTime(Date.now() + 1000)
    processOvernightUpdate('night2', 999_999n, false)
    jest.setSystemTime(Date.now() + 1000)

    const next = processOvernightUpdate('night2', 1000n, true)
    // Still anchored at ~1000, not dragged toward the 999999 tick.
    expect(next.price).toEqual(warm.price)
  })

  it('smooths continuously across many ticks while overnight', () => {
    processOvernightUpdate('night3', 1000n, true)

    const prices: bigint[] = []
    for (let i = 0; i < 5; i++) {
      jest.setSystemTime(Date.now() + 1000)
      prices.push(processOvernightUpdate('night3', 2000n, true).price)
    }

    // Each tick moves partway toward 2000, never jumping straight to the raw value.
    expect(prices[0]).toBeGreaterThan(1000n)
    expect(prices[0]).toBeLessThan(2000n)
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThan(prices[i - 1])
      expect(prices[i]).toBeLessThan(2000n)
    }
  })

  it('keeps state isolated per asset', () => {
    processOvernightUpdate('night4a', 1000n, true)
    processOvernightUpdate('night4b', 5000n, true)
    jest.setSystemTime(Date.now() + 1000)

    expect(processOvernightUpdate('night4b', 5000n, true).price).toBeGreaterThan(4000n)
    expect(processOvernightUpdate('night4a', 1000n, true).price).toBeLessThan(2000n)
  })

  it('resets to a cold start after a gap exceeding timeoutMs', () => {
    processOvernightUpdate('night5', 1000n, true)
    jest.setSystemTime(Date.now() + 1000)
    const warm = processOvernightUpdate('night5', 1000n, true)
    expect(warm.price).toEqual(1000n)

    // A gap longer than timeoutMs, which is what happens between two overnight
    // sessions since the filter is not fed while the market is elsewhere.
    jest.setSystemTime(Date.now() + TIMEOUT_MS + 1)
    const cold = processOvernightUpdate('night5', 7000n, true)

    // Cold start takes the price as-is rather than easing toward it from 1000.
    expect(cold.price).toEqual(7000n)
    expect(cold.x).toEqual(-1n)
  })

  it('does not reset within timeoutMs', () => {
    processOvernightUpdate('night6', 1000n, true)
    jest.setSystemTime(Date.now() + TIMEOUT_MS - 1000)
    const stillWarm = processOvernightUpdate('night6', 7000n, true)

    expect(stillWarm.price).toBeLessThan(7000n)
    expect(stillWarm.x).toEqual(1000n)
  })
})
