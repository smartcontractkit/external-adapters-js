import { SessionAwareSmoother } from '../../../src/lib/smoother'

describe('SessionAwareSmoother', () => {
  it('processUpdate', () => {
    const smoother = new SessionAwareSmoother()
    const spread = 1n * 10n ** 18n // Use a small spread value for testing

    // Should return raw price when outside transition window (t=100)
    expect(smoother.processUpdate(10n, spread, 100).price).toBe(10n)

    // Should return raw price when before transition window (t=-20)
    expect(smoother.processUpdate(20n, spread, -20).price).toBe(20n)

    // Should return raw price at transition boundary after (t=60)
    expect(smoother.processUpdate(30n, spread, 60).price).toBe(30n)

    // Should return raw price at transition boundary before (t=-10)
    expect(smoother.processUpdate(40n, spread, -10).price).toBe(40n)

    // Initialize filter with some updates outside window to build Kalman filter state
    smoother.processUpdate(100n, spread, 100)
    smoother.processUpdate(100n, spread, 100)

    // Should be smoothed at t=0 (weight=1.0, fully smoothed)
    // At t=0, weight=1.0, so output should equal the Kalman smoothed price (not raw)
    expect(smoother.processUpdate(100n, spread, 0).price).toBe(51n)

    // Should be smoothed at t=30 (weight=0.5, half smoothed)
    // At t=30, weight=0.5, so result should be between raw and smoothed
    expect(smoother.processUpdate(150n, spread, 30)).toStrictEqual({
      price: 105n,
      x: 51n,
      p: 195658542611130429n,
    })

    // Should be smoothed at t=-5 (weight=0.5, half smoothed)
    expect(smoother.processUpdate(200n, spread, -5)).toStrictEqual({
      price: 138n,
      x: 62n,
      p: 172332919389933648n,
    })
  })

  const scale = (price: number) => BigInt(price) * 10n ** 18n

  it('should use MIN_R for small spread values', () => {
    const MIN_R = 10000000000000000n // 0.01 scaled to 18 decimals
    const smallSpread = 1000000000000000n // 0.001 scaled (less than MIN_R)

    const smoother = new SessionAwareSmoother()
    smoother.processUpdate(scale(100), MIN_R, 100)
    smoother.processUpdate(scale(100), MIN_R, 100)
    smoother.processUpdate(scale(100), MIN_R, 100)

    expect(smoother.processUpdate(scale(150), smallSpread, 0).price).toBe(118189850325750765400n)
  })

  it('should use large spread values', () => {
    const largeSpread = scale(100) // 100 scaled to 18 decimals (very large spread)

    const smoother = new SessionAwareSmoother()
    smoother.processUpdate(scale(10), scale(1), 100)
    smoother.processUpdate(scale(20), scale(1), -20)
    smoother.processUpdate(scale(30), scale(1), 60)
    smoother.processUpdate(scale(40), scale(1), -10)
    smoother.processUpdate(scale(100), scale(1), 100)
    smoother.processUpdate(scale(100), scale(1), 100)

    expect(smoother.processUpdate(scale(150), largeSpread, 30).price).toBe(98306663670976788968n)
  })
})
