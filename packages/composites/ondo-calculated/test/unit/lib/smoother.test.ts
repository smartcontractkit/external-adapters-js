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
      const CONSTANT_PRICE = 100n * 10n ** 18n
      const WINDOW_SIZE = 23

      // Fill the buffer with constant values (outside transition window)
      for (let i = 0; i < WINDOW_SIZE; i++) {
        smoother.processUpdate(CONSTANT_PRICE, 100) // t=100 is outside window
      }

      // Now test during transition (t=0 means fully smoothed, w=1.0)
      const resultAtTransition = smoother.processUpdate(CONSTANT_PRICE, 0)

      // BUG CHECK: If smoother is correct, constant input should produce constant output
      expect(resultAtTransition).toBe(CONSTANT_PRICE)
    })

    it('should produce constant output at various transition points for constant input', () => {
      const smoother = new SessionAwareSmoother()
      const CONSTANT_PRICE = 100n * 10n ** 18n
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
      const BASELINE = 100n * 10n ** 18n
      const WINDOW_SIZE = 23

      // Fill buffer with baseline values (outside transition)
      for (let i = 0; i < WINDOW_SIZE; i++) {
        smoother.processUpdate(BASELINE, 100)
      }

      // Inject bump and collect all results during transition
      const prices = [200n, 300n, 200n, 100n, 100n, 100n].map((p) => p * 10n ** 18n)
      const results: bigint[] = []

      for (let i = 0; i < prices.length; i++) {
        const result = smoother.processUpdate(prices[i], i + 1)
        results.push(result)
      }

      // BUG CHECK: Output should never drop below the minimum input (baseline)
      for (const r of results) {
        expect(r).toBeGreaterThanOrEqual(BASELINE)
      }
    })

    it('should converge back to baseline after bump exits window', () => {
      const smoother = new SessionAwareSmoother()
      const BASELINE = 100n * 10n ** 18n
      const WINDOW_SIZE = 23

      // Fill buffer with baseline
      for (let i = 0; i < WINDOW_SIZE; i++) {
        smoother.processUpdate(BASELINE, 100)
      }

      // Inject bump
      const bump = [200n, 300n, 200n].map((p) => p * 10n ** 18n)
      for (const price of bump) {
        smoother.processUpdate(price, 1) // During transition
      }

      // Let bump fully wash out of window (need WINDOW_SIZE more values)
      const convergenceResults: bigint[] = []
      for (let i = 0; i < WINDOW_SIZE; i++) {
        const result = smoother.processUpdate(BASELINE, i + 1)
        convergenceResults.push(result)
      }

      // After bump exits, output should converge to baseline within 1% tolerance
      const finalResult = convergenceResults[convergenceResults.length - 1]
      const tolerance = BASELINE / 100n // 1% tolerance

      expect(finalResult).toBeGreaterThanOrEqual(BASELINE - tolerance)
      expect(finalResult).toBeLessThanOrEqual(BASELINE + tolerance)
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
