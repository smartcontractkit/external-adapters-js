import { SessionAwareSmoother } from '../../../../src/lib/smoother/smoother'

describe('EmaSmoother', () => {
  it('should return raw price when outside transition window', () => {
    const smoother = new SessionAwareSmoother()
    const spread = 1n * 10n ** 18n

    // Should return raw price when outside transition window (t=100)
    expect(smoother.processUpdate('ema', 10n, spread, 100).price).toBe(10n)

    // Should return raw price when before transition window (t=-20)
    expect(smoother.processUpdate('ema', 20n, spread, -20).price).toBe(20n)

    // Should return raw price at transition boundary after (t=60)
    expect(smoother.processUpdate('ema', 30n, spread, 60).price).toBe(30n)

    // Should return raw price at transition boundary before (t=-10)
    expect(smoother.processUpdate('ema', 40n, spread, -10).price).toBe(40n)
  })

  it('should apply smoothing during transition window', () => {
    const smoother = new SessionAwareSmoother()
    const spread = 1n * 10n ** 18n

    // Initialize filter with some updates outside window to build EMA state
    smoother.processUpdate('ema', 100n, spread, 100)
    smoother.processUpdate('ema', 100n, spread, 100)

    // Should be smoothed at t=0 (weight=1.0, fully smoothed)
    const resultAt0 = smoother.processUpdate('ema', 100n, spread, 0)
    expect(resultAt0.price).toBeGreaterThan(0n)
    expect(resultAt0.x).toBeGreaterThan(0n) // Previous state exists

    // Should be smoothed at t=30 (weight=0.5, half smoothed)
    const resultAt30 = smoother.processUpdate('ema', 150n, spread, 30)
    expect(resultAt30.price).toBeGreaterThan(resultAt0.price) // Should increase toward 150
    expect(resultAt30.price).toBeLessThan(150n) // But not reach raw price yet
    expect(resultAt30.p).toBe(0n) // EMA doesn't track covariance
  })

  it('should handle EMA filter initialization correctly', () => {
    const smoother = new SessionAwareSmoother()
    const spread = 1n * 10n ** 18n

    // First update should initialize EMA with the price itself
    const firstResult = smoother.processUpdate('ema', 100n, spread, 0)
    expect(firstResult.price).toBe(100n) // At t=0, weight=1.0, so fully smoothed = EMA value = input
    expect(firstResult.x).toBe(-1n) // Previous state was uninitialized

    // Second update should apply EMA smoothing
    const secondResult = smoother.processUpdate('ema', 150n, spread, 0)
    expect(secondResult.price).toBeGreaterThan(100n) // Should move toward 150
    expect(secondResult.price).toBeLessThan(150n) // But not reach it immediately
    expect(secondResult.x).toBe(100n) // Previous state should be first result's price
  })
})
