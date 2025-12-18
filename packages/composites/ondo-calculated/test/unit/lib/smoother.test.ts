import console from 'console'
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
    expect(resultInsideWindow).toBe(58n)

    // Should be smoothed at t=30 (weight=0.5, half smoothed)
    const resultPositive = smoother.processUpdate(150n, 30)
    expect(resultPositive).toBe(102n)

    // Should be smoothed at t=-5 (weight=0.5, half smoothed)
    const resultNegative = smoother.processUpdate(200n, -5)
    expect(resultNegative).toBe(126n)
  })

  it('constant input should give constant output', () => {
    console.log('===')
    const totalTime = 80
    const leadTime = 30
    const raw = Array.from({ length: totalTime }, () => 100n)

    const smoother = new SessionAwareSmoother()
    raw.forEach((price, index) => {
      const t = index - leadTime
      const smoothed = smoother.processUpdate(price, t)
      console.log(`t=${t}, raw=${price}, smoothed=${smoothed}`)
    })
  })

  it('one time bump should not oscillate', () => {
    console.log('===')
    const totalTime = 80
    const leadTime = 30
    const raw = [...Array.from({ length: leadTime }, () => 100n), 200n, 300n, 200n]
    raw.push(...Array.from({ length: totalTime - raw.length }, () => 100n))

    const smoother = new SessionAwareSmoother()
    raw.forEach((price, index) => {
      const t = index - leadTime
      const smoothed = smoother.processUpdate(price, t)
      console.log(`t=${t}, raw=${price}, smoothed=${smoothed}`)
    })
  })
})
