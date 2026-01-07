import { parseUnits } from 'ethers'
import * as fs from 'fs'
import * as path from 'path'
import { SessionAwareSmoother } from '../../../../src/lib/smoother/smoother'

const scale = (price: number) => parseUnits(price.toFixed(18), 18)

describe('KalmanSmoother', () => {
  it('processUpdate', () => {
    const smoother = new SessionAwareSmoother()
    const spread = 1n * 10n ** 18n // Use a small spread value for testing

    // Should return raw price when outside transition window (t=100)
    expect(smoother.processUpdate('kalman', 10n, spread, 100).price).toBe(10n)

    // Should return raw price when before transition window (t=-20)
    expect(smoother.processUpdate('kalman', 20n, spread, -20).price).toBe(20n)

    // Should return raw price at transition boundary after (t=60)
    expect(smoother.processUpdate('kalman', 30n, spread, 60).price).toBe(30n)

    // Should return raw price at transition boundary before (t=-10)
    expect(smoother.processUpdate('kalman', 40n, spread, -10).price).toBe(40n)

    // Initialize filter with some updates outside window to build Kalman filter state
    smoother.processUpdate('kalman', 100n, spread, 100)
    smoother.processUpdate('kalman', 100n, spread, 100)

    // Should be smoothed at t=0 (weight=1.0, fully smoothed)
    // Filter initialized with small values, so Kalman state is low - just verify smoothing happens
    const resultAt0 = smoother.processUpdate('kalman', 100n, spread, 0)
    expect(resultAt0.price).toBeGreaterThan(0n)
    expect(resultAt0.x).toBeGreaterThan(0n) // Previous state exists

    // Should be smoothed at t=30 (weight=0.5, half smoothed)
    // Result should blend between Kalman estimate and raw price
    const resultAt30 = smoother.processUpdate('kalman', 150n, spread, 30)
    expect(resultAt30.price).toBeGreaterThan(resultAt0.price) // Should increase toward 150
    expect(resultAt30.price).toBeLessThan(150n) // But not reach raw price yet
    expect(resultAt30.x).toBe(resultAt0.price) // Previous state should be last output's Kalman estimate
    expect(resultAt30.p).toBeGreaterThan(0n) // Covariance should be positive

    // Should be smoothed at t=-5 (weight=0.5, half smoothed)
    const resultAtMinus5 = smoother.processUpdate('kalman', 200n, spread, -5)
    expect(resultAtMinus5.price).toBeGreaterThan(resultAt30.price) // Should increase toward 200
    expect(resultAtMinus5.price).toBeLessThan(200n) // But not reach raw price
    expect(resultAtMinus5.p).toBeLessThan(resultAt30.p) // Covariance should decrease over time
  })

  it('should use MIN_R for small spread values', () => {
    const MIN_R = 2545840040746239n // 0.002545840040746239 scaled to 18 decimals (from CONFIG)
    const smallSpread = 1000000000000000n // 0.001 scaled (less than MIN_R)

    // Run with small spread
    const smoother1 = new SessionAwareSmoother()
    smoother1.processUpdate('kalman', scale(100), smallSpread, 100)
    smoother1.processUpdate('kalman', scale(100), smallSpread, 100)
    smoother1.processUpdate('kalman', scale(100), smallSpread, 100)
    const resultSmallSpread = smoother1.processUpdate('kalman', scale(150), smallSpread, 0)

    // Run with MIN_R directly
    const smoother2 = new SessionAwareSmoother()
    smoother2.processUpdate('kalman', scale(100), MIN_R, 100)
    smoother2.processUpdate('kalman', scale(100), MIN_R, 100)
    smoother2.processUpdate('kalman', scale(100), MIN_R, 100)
    const resultMinR = smoother2.processUpdate('kalman', scale(150), MIN_R, 0)

    // Both should produce identical results since small spread should be clamped to MIN_R
    expect(resultSmallSpread.price).toBe(resultMinR.price)
    expect(resultSmallSpread.p).toBe(resultMinR.p)
  })

  it('should use large spread values', () => {
    const largeSpread = scale(100) // 100 scaled to 18 decimals (very large spread)

    const smoother = new SessionAwareSmoother()
    smoother.processUpdate('kalman', scale(10), scale(1), 100)
    smoother.processUpdate('kalman', scale(20), scale(1), -20)
    smoother.processUpdate('kalman', scale(30), scale(1), 60)
    smoother.processUpdate('kalman', scale(40), scale(1), -10)
    smoother.processUpdate('kalman', scale(100), scale(1), 100)
    smoother.processUpdate('kalman', scale(100), scale(1), 100)
    const result = smoother.processUpdate('kalman', scale(150), largeSpread, 30)
    // Large spread = high uncertainty = filter trusts prior more = output closer to 100 than 150
    const midpoint = scale(125) // Midpoint between 100 and 150
    expect(result.price).toBeGreaterThan(scale(100)) // Above prior
    expect(result.price).toBeLessThan(midpoint) // But closer to prior than new measurement
  })

  it('should not undershoot with constant price during transition', () => {
    const smoother = new SessionAwareSmoother()
    const constantPrice = scale(100)
    const spread = scale(1)

    // Initialize filter before transition window (time progressing toward transition)
    for (let t = -20; t < -10; t += 1) {
      smoother.processUpdate('kalman', constantPrice, spread, t)
    }

    // Track minimum price during transition window (-10 to +60)
    let minPrice = constantPrice
    for (let t = -10; t <= 60; t += 1) {
      const result = smoother.processUpdate('kalman', constantPrice, spread, t)
      if (result.price < minPrice) {
        minPrice = result.price
      }
    }

    // With constant input, output should not drop more than 5% below input
    const maxUndershoot = (constantPrice * 95n) / 100n
    expect(minPrice).toBeGreaterThanOrEqual(maxUndershoot)
  })

  it('should handle price bump after transition without excessive undershoot', () => {
    const smoother = new SessionAwareSmoother()
    const basePrice = scale(100)
    const spread = scale(1)

    // Initialize filter before transition window (time progressing toward transition)
    for (let t = -20; t < -10; t += 1) {
      smoother.processUpdate('kalman', basePrice, spread, t)
    }

    // Simulate transition with a bump pattern: 100 -> 200 -> 300 -> 200 -> 100
    const priceSequence = [
      { t: -10, price: basePrice },
      { t: -5, price: basePrice },
      { t: 0, price: basePrice },
      { t: 5, price: scale(200) },
      { t: 10, price: scale(300) },
      { t: 15, price: scale(200) },
      { t: 20, price: basePrice },
      { t: 30, price: basePrice },
      { t: 40, price: basePrice },
      { t: 50, price: basePrice },
      { t: 60, price: basePrice },
      { t: 70, price: basePrice },
    ]

    let minPrice = basePrice
    for (const { t, price } of priceSequence) {
      const result = smoother.processUpdate('kalman', price, spread, t)
      if (result.price < minPrice) {
        minPrice = result.price
      }
    }

    // Output should not drop more than 20% below base price
    const maxUndershoot = (basePrice * 80n) / 100n
    expect(minPrice).toBeGreaterThanOrEqual(maxUndershoot)
  })

  it('should handle zero and negative spread without errors', () => {
    const smoother = new SessionAwareSmoother()

    // Zero spread
    smoother.processUpdate('kalman', scale(100), 0n, 100)
    smoother.processUpdate('kalman', scale(100), 0n, 100)
    const zeroResult = smoother.processUpdate('kalman', scale(150), 0n, 0)
    expect(zeroResult.price).toBeGreaterThan(0n)

    // Negative spread
    const smoother2 = new SessionAwareSmoother()
    smoother2.processUpdate('kalman', scale(100), -1n, 100)
    smoother2.processUpdate('kalman', scale(100), -1n, 100)
    const negResult = smoother2.processUpdate('kalman', scale(150), -1n, 0)
    expect(negResult.price).toBeGreaterThan(0n)
  })

  it('should converge to stable price with consistent inputs during transition', () => {
    const smoother = new SessionAwareSmoother()
    const targetPrice = scale(100)
    const spread = scale(1)

    // Initialize filter at a DIFFERENT price (200) before transition window
    smoother.processUpdate('kalman', scale(200), spread, -20)
    smoother.processUpdate('kalman', scale(200), spread, -15)

    // Feed target price as time progresses through transition (-10 to +60)
    let firstSmoothedPrice = 0n
    let mostSmoothedPrice = 0n // Price at t=0 where weight=1.0

    for (let t = -10; t <= 60; t += 1) {
      const result = smoother.processUpdate('kalman', targetPrice, spread, t)
      if (t === -10) firstSmoothedPrice = result.price
      if (t === 0) mostSmoothedPrice = result.price
    }

    // At t=-10 (weight=0), should return raw price
    expect(firstSmoothedPrice).toBe(targetPrice)

    // At t=0 (weight=1.0, fully smoothed), Kalman state started at 200 but has been
    // updating toward 100 since t=-10, so should be between target and initial
    expect(mostSmoothedPrice).toBeGreaterThanOrEqual(targetPrice)
    expect(mostSmoothedPrice).toBeLessThan(scale(200))
  })

  it('should not overshoot beyond brief price spike during transition', () => {
    const smoother = new SessionAwareSmoother()
    const basePrice = scale(500)
    const spikePrice = scale(510)
    const spread = scale(1)

    // Initialize at stable $500 before transition
    for (let t = -20; t < -10; t += 1) {
      smoother.processUpdate('kalman', basePrice, spread, t)
    }

    // Brief spike pattern: $500 -> $510 (spike) -> $500 (return)
    // Spike occurs just after transition point (t=0)
    const spikeSequence = [
      { t: -10, price: basePrice },
      { t: -5, price: basePrice },
      { t: 0, price: basePrice },
      { t: 1, price: spikePrice }, // Brief spike to $510
      { t: 2, price: spikePrice },
      { t: 3, price: basePrice }, // Return to $500
      { t: 4, price: basePrice },
      { t: 5, price: basePrice },
      { t: 6, price: basePrice },
      { t: 7, price: basePrice },
      { t: 8, price: basePrice },
      { t: 10, price: basePrice },
      { t: 15, price: basePrice },
      { t: 20, price: basePrice },
    ]

    let maxSmoothedPrice = 0n
    const results: { t: number; input: bigint; output: bigint }[] = []

    for (const { t, price } of spikeSequence) {
      const result = smoother.processUpdate('kalman', price, spread, t)
      results.push({ t, input: price, output: result.price })
      if (result.price > maxSmoothedPrice) {
        maxSmoothedPrice = result.price
      }
    }

    // Smoothed price should NEVER exceed the spike price ($510)
    // Bad behavior: smoothed peaks at $512.90 (29% overshoot of the $10 increase)
    expect(maxSmoothedPrice).toBeLessThanOrEqual(spikePrice)
  })

  it('should not amplify price deviation after brief spike returns to baseline', () => {
    const smoother = new SessionAwareSmoother()
    const basePrice = scale(500)
    const spikePrice = scale(510)
    const spread = scale(1)

    // Initialize at stable $500 before transition
    for (let t = -20; t < -10; t += 1) {
      smoother.processUpdate('kalman', basePrice, spread, t)
    }

    // Spike and return
    smoother.processUpdate('kalman', basePrice, spread, -10)
    smoother.processUpdate('kalman', basePrice, spread, 0)
    smoother.processUpdate('kalman', spikePrice, spread, 1) // Spike
    smoother.processUpdate('kalman', basePrice, spread, 2) // Immediate return

    // Track smoothed prices after spike has ended
    // Bad behavior: at t=4, smoothed > spike; at t=7, overshoot is 29% of original increase
    const afterSpikeResults: { t: number; price: bigint }[] = []
    for (let t = 3; t <= 15; t += 1) {
      const result = smoother.processUpdate('kalman', basePrice, spread, t)
      afterSpikeResults.push({ t, price: result.price })
    }

    // At t=4 (4 seconds after spike started), smoothed should NOT exceed spike price
    const resultAt4 = afterSpikeResults.find((r) => r.t === 4)
    expect(resultAt4?.price).toBeLessThanOrEqual(spikePrice)

    // At t=7 (7 seconds after spike started), should not have 29% amplification
    // Original increase was $10 ($500 -> $510), 29% more = $12.90 overshoot
    const resultAt7 = afterSpikeResults.find((r) => r.t === 7)
    const maxAllowedOvershoot = basePrice + ((spikePrice - basePrice) * 110n) / 100n // Allow 10% amplification max
    expect(resultAt7?.price).toBeLessThanOrEqual(maxAllowedOvershoot)

    // Should converge back toward baseline
    const lastResult = afterSpikeResults[afterSpikeResults.length - 1]
    const tolerance = basePrice / 50n // 2% tolerance
    expect(lastResult.price).toBeGreaterThan(basePrice - tolerance)
    expect(lastResult.price).toBeLessThan(basePrice + tolerance)
  })
})

describe('KalmanSmoother', () => {
  it('Handle real world data', () => {
    const data = fs
      .readFileSync(path.join(__dirname, 'kalman_smoother_sample_input.csv'), 'utf8')
      .split('\n')
      .map((line) => line.split(','))

    const smoother = new SessionAwareSmoother()

    const boundary = 1766437200
    const results: bigint[] = []
    for (const [price, spread, timestamp] of data) {
      results.push(
        smoother.processUpdate(
          'kalman',
          parseUnits(price, 18),
          parseUnits(spread, 18),
          Number(timestamp) - boundary,
        ).price,
      )
    }

    const expectedResults = fs
      .readFileSync(path.join(__dirname, 'kalman_smoother_sample_output.csv'), 'utf8')
      .split('\n')
      .map((line) => line.split(',')[0])

    expect(results.length).toBe(expectedResults.length)

    for (let i = 0; i < results.length; i++) {
      const actual = results[i].toString()
      const expected = expectedResults[i]

      if (actual !== expected) {
        const [price, spread, timestamp] = data[i]
        throw new Error(
          `Mismatch at row ${i + 1}:\n` +
            `  Input: price=${price}, spread=${spread}, timestamp=${timestamp}\n` +
            `  Expected: ${expected} \n` +
            `  Actual:   ${actual} \n` +
            `  Difference: ${BigInt(actual) - BigInt(expected)}`,
        )
      }
    }
  })
})
