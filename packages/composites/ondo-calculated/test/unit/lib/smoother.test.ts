import { SessionAwareSmoother } from '../../../src/lib/smoother'

describe('SessionAwareSmoother', () => {
  it('processUpdate', () => {
    const smoother = new SessionAwareSmoother()

    // Should return raw price when outside transition window (t=100)
    const result = smoother.processUpdate(10n, 100)
    expect(result).toBe(10n)

    // Should return raw price when before transition window (t=-20)
    const resultBefore = smoother.processUpdate(20n, -20)
    expect(resultBefore).toBe(20n)

    // Should return raw price at transition boundary after (t=60)
    const resultAtBoundary = smoother.processUpdate(30n, 60)
    expect(resultAtBoundary).toBe(30n)

    // Should return raw price at transition boundary before (t=-10)
    const resultAtBoundaryBefore = smoother.processUpdate(40n, -10)
    expect(resultAtBoundaryBefore).toBe(40n)

    // Test multiple updates to fill buffer - should return raw price when outside transition window
    for (let i = 0; i < 25; i++) {
      const price = BigInt(50 + i)
      const result = smoother.processUpdate(price, 100)
      expect(result).toBe(price)
    }

    // Should be smoothed at t=0 (weight=1.0, fully smoothed)
    const resultInsideWindow = smoother.processUpdate(100n, 0)
    // Causal filter at the end of window [50, 51, ..., 74, 100] should be around 100 or slightly above
    expect(resultInsideWindow).toBe(83n)

    // Should be smoothed at t=30 (weight=0.5, half smoothed)
    const resultPositive = smoother.processUpdate(150n, 30)
    expect(resultPositive).toBe(128n)

    // Should be smoothed at t=-5 (weight=0.5, half smoothed)
    const resultNegative = smoother.processUpdate(200n, -5)
    expect(resultNegative).toBe(171n)
  })

  describe('Constant Value Stability', () => {
    it('should maintain constant output for constant input during transition', () => {
      const smoother = new SessionAwareSmoother()
      const CONSTANT_PRICE = 100n
      const WINDOW_SIZE = 23

      // Fill the buffer with constant values (outside transition window)
      for (let i = 0; i < WINDOW_SIZE; i++) {
        smoother.processUpdate(CONSTANT_PRICE, 100) // t=100 is outside window
      }

      // Now test during transition (t=0 means fully smoothed, w=1.0)
      const resultAtTransition = smoother.processUpdate(CONSTANT_PRICE, 0)

      // BUG CHECK: If smoother is correct, constant input should produce constant output
      // The review mentions this drops to 91n, which indicates a normalization bug
      expect(resultAtTransition).toBe(CONSTANT_PRICE)
    })

    it('should produce constant output at various transition points for constant input', () => {
      const smoother = new SessionAwareSmoother()
      const CONSTANT_PRICE = 100n
      const WINDOW_SIZE = 23

      // Fill buffer with constant values
      for (let i = 0; i < WINDOW_SIZE; i++) {
        smoother.processUpdate(CONSTANT_PRICE, 100)
      }

      // Test at different points in the transition window
      const testPoints = [-5, 0, 10, 30, 45]
      for (const t of testPoints) {
        const result = smoother.processUpdate(CONSTANT_PRICE, t)
        expect(result).toBe(CONSTANT_PRICE)
      }
    })
  })

  describe('Bump Response Behavior', () => {
    it('should not undershoot below input minimum during bump transition', () => {
      const smoother = new SessionAwareSmoother()
      const BASELINE = 100n
      const WINDOW_SIZE = 23

      // Fill buffer with baseline values (outside transition)
      for (let i = 0; i < WINDOW_SIZE; i++) {
        smoother.processUpdate(BASELINE, 100)
      }

      // Simulate transition start: add bump pattern just after transition
      // The review mentions: constant 100n, then 200n, 300n, 200n bump
      const bumpPattern = [200n, 300n, 200n]
      const results: bigint[] = []

      for (const price of bumpPattern) {
        // t=1, 2, 3... are just after transition (should be smoothed)
        const result = smoother.processUpdate(price, results.length + 1)
        results.push(result)
      }

      // BUG CHECK: The review mentions the smoothed value drops as low as 85n
      // This should never happen - output should never go below the minimum input (100n)
      const minResult = results.reduce((min, r) => (r < min ? r : min), results[0])
      expect(minResult).toBeGreaterThanOrEqual(BASELINE)
    })

    it('should not exhibit Runge phenomenon (excessive oscillation) after bump', () => {
      const smoother = new SessionAwareSmoother()
      const BASELINE = 100n
      const WINDOW_SIZE = 23

      // Fill buffer with baseline
      for (let i = 0; i < WINDOW_SIZE; i++) {
        smoother.processUpdate(BASELINE, 100)
      }

      // Add bump and then return to baseline
      const prices = [200n, 300n, 200n, 100n, 100n, 100n, 100n, 100n]
      const results: bigint[] = []

      for (let i = 0; i < prices.length; i++) {
        const result = smoother.processUpdate(prices[i], i + 1)
        results.push(result)
      }

      // After returning to baseline inputs, the output should converge back to baseline
      // and not oscillate wildly (the "rebound" mentioned in review)
      const lastFewResults = results.slice(-3)
      for (const r of lastFewResults) {
        // Allow some tolerance but should be within 60% of baseline (it's whippy!)
        expect(r).toBeGreaterThan(40n)
        expect(r).toBeLessThan(160n)
      }
    })
  })

  describe('Savitzky-Golay Coefficient Normalization', () => {
    it('should have coefficients that sum to 1.0 (normalization check)', () => {
      // This is a unit test for the mathematical correctness of the filter
      // The 91n bug suggests coefficients may not sum to 1.0
      const smoother = new SessionAwareSmoother()
      const CONSTANT_PRICE = 1000000n // Use larger value to reduce rounding error impact
      const WINDOW_SIZE = 23

      // Fill with constant
      for (let i = 0; i < WINDOW_SIZE; i++) {
        smoother.processUpdate(CONSTANT_PRICE, 100)
      }

      // At full smoothing (t=0, w=1.0), output should equal input for constant signal
      const result = smoother.processUpdate(CONSTANT_PRICE, 0)

      // Allow small precision tolerance due to bigint/number conversion
      const tolerance = CONSTANT_PRICE / 1000n // 0.1% tolerance
      expect(result).toBeGreaterThanOrEqual(CONSTANT_PRICE - tolerance)
      expect(result).toBeLessThanOrEqual(CONSTANT_PRICE + tolerance)
    })
  })
})
