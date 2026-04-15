import { parseUnits } from 'ethers'
import * as fs from 'fs'
import * as path from 'path'
import { processUpdate } from '../../../../src/lib/smoother/smoother'

describe('EmaSmoother', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  const spread = 1n * 10n ** 18n

  it('should return raw price when outside transition window', () => {
    // Should return raw price when outside transition window (t=100)
    expect(processUpdate('ema', 'test1', 10n, spread, 100).price).toBe(10n)

    // Should return raw price when before transition window (t=-20)
    expect(processUpdate('ema', 'test1', 20n, spread, -20).price).toBe(20n)

    // Should return raw price at transition boundary after (t=60)
    expect(processUpdate('ema', 'test1', 30n, spread, 60).price).toBe(30n)

    // Should return raw price at transition boundary before (t=-10)
    expect(processUpdate('ema', 'test1', 40n, spread, -10).price).toBe(40n)
  })

  it('should apply smoothing during transition window', () => {
    // Initialize filter with some updates outside window to build EMA state
    processUpdate('ema', 'test2', 100n, spread, 100)
    processUpdate('ema', 'test2', 100n, spread, 100)

    // Should be smoothed at t=0 (weight=1.0, fully smoothed)
    const resultAt0 = processUpdate('ema', 'test2', 100n, spread, 0)
    expect(resultAt0.price).toBeGreaterThan(0n)
    expect(resultAt0.x).toBeGreaterThan(0n) // Previous state exists

    // Should be smoothed at t=30 (weight=0.5, half smoothed)
    jest.setSystemTime(Date.now() + 1000)
    const resultAt30 = processUpdate('ema', 'test2', 150n, spread, 30)
    expect(resultAt30.price).toBeGreaterThan(resultAt0.price) // Should increase toward 150
    expect(resultAt30.price).toBeLessThan(150n) // But not reach raw price yet
  })

  it('should handle EMA filter initialization correctly', () => {
    // First update should initialize EMA with the price itself
    const firstResult = processUpdate('ema', 'test3', 100n, spread, 0)
    expect(firstResult.price).toBe(100n) // At t=0, weight=1.0, so fully smoothed = EMA value = input
    expect(firstResult.x).toBe(-1n) // Previous state was uninitialized

    // Second update should apply EMA smoothing
    jest.setSystemTime(Date.now() + 1000)
    const secondResult = processUpdate('ema', 'test3', 150n, spread, 0)
    expect(secondResult.price).toBeGreaterThan(100n) // Should move toward 150
    expect(secondResult.price).toBeLessThan(150n) // But not reach it immediately
    expect(secondResult.x).toBe(100n) // Previous state should be first result's price
  })

  it('should test various effective alpha (a) values with different time intervals', () => {
    const initialPrice = 100n
    const newPrice = 200n
    const baseTime = Date.now()

    // Test case 1: Very small interval (produces small "a", less smoothing)
    const asset1 = 'test_alpha_50ms'
    jest.setSystemTime(baseTime)
    processUpdate('ema', asset1, initialPrice, spread, 0)
    jest.setSystemTime(baseTime + 50)
    const resultSmallInterval = processUpdate('ema', asset1, newPrice, spread, 0)
    expect(resultSmallInterval.p).toBe(50)
    expect(resultSmallInterval.price).toBe(100n)

    // Test case 2: Medium interval (500ms)
    const asset2 = 'test_alpha_500ms'
    jest.setSystemTime(baseTime)
    processUpdate('ema', asset2, initialPrice, spread, 0)
    jest.setSystemTime(baseTime + 500)
    const resultMediumInterval = processUpdate('ema', asset2, newPrice, spread, 0)
    expect(resultMediumInterval.p).toBe(500)
    expect(resultMediumInterval.price).toBe(104n)

    // Test case 3: Base interval (1000ms, should produce a ≈ 0.095)
    const asset3 = 'test_alpha_1000ms'
    jest.setSystemTime(baseTime)
    processUpdate('ema', asset3, initialPrice, spread, 0)
    jest.setSystemTime(baseTime + 1000)
    const resultBaseInterval = processUpdate('ema', asset3, newPrice, spread, 0)
    expect(resultBaseInterval.p).toBe(1000)
    expect(resultBaseInterval.price).toBe(109n)

    // Test case 4: Large interval (5000ms, produces larger "a", more smoothing)
    const asset4 = 'test_alpha_5000ms'
    jest.setSystemTime(baseTime)
    processUpdate('ema', asset4, initialPrice, spread, 0)
    jest.setSystemTime(baseTime + 5000)
    const resultLargeInterval = processUpdate('ema', asset4, newPrice, spread, 0)
    expect(resultLargeInterval.p).toBe(5000)
    expect(resultLargeInterval.price).toBe(139n)

    // Test case 5: Very large interval (10000ms, produces "a" close to 1)
    const asset5 = 'test_alpha_10000ms'
    jest.setSystemTime(baseTime)
    processUpdate('ema', asset5, initialPrice, spread, 0)
    jest.setSystemTime(baseTime + 10000)
    const resultVeryLargeInterval = processUpdate('ema', asset5, newPrice, spread, 0)
    expect(resultVeryLargeInterval.p).toBe(10000)
    expect(resultVeryLargeInterval.price).toBe(163n)
  })

  it('should reset state when no request for more than 10 minutes', () => {
    const TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes
    const assetId = 'ema_timeout_asset'
    const t0 = 1000000000000

    jest.setSystemTime(t0)
    processUpdate('ema', assetId, 100n, spread, 0)
    jest.setSystemTime(t0 + 1000)
    const afterUpdates = processUpdate('ema', assetId, 150n, spread, 0)
    expect(afterUpdates.x).toBe(100n)
    expect(afterUpdates.p).toBe(1000)
    expect(afterUpdates.price).toBe(104n)

    // Advance time so last update was strictly more than 10 minutes ago
    jest.setSystemTime(t0 + 1000 + TIMEOUT_MS + 1)

    const afterTimeout = processUpdate('ema', assetId, 200n, spread, 0)
    expect(afterTimeout.x).toBe(-1n)
    expect(afterTimeout.p).toBe(t0 + 1000 + TIMEOUT_MS + 1)
    expect(afterTimeout.price).toBe(200n)
  })

  it('Handle real world data', () => {
    const data = fs
      .readFileSync(path.join(__dirname, 'ema_smoother_sample.csv'), 'utf8')
      .split('\n')
      .map((line) => line.split(','))

    const boundary = 1766437200

    for (const [price, timestamp, expected] of data) {
      jest.setSystemTime(Date.now() + 1000)
      const tolerance = 10n ** 6n
      const actual = BigInt(
        processUpdate('ema', 'test4', parseUnits(price, 18), 0n, Number(timestamp) - boundary)
          .price,
      )
      const expectedValue = parseUnits(expected, 18)
      const diff = actual > expectedValue ? actual - expectedValue : expectedValue - actual

      if (diff >= tolerance) {
        throw new Error(
          `Mismatch:\n` +
            `  Input: price=${price}, timestamp=${timestamp}\n` +
            `  Expected: ${expectedValue} \n` +
            `  Actual:   ${actual} \n` +
            `  Difference: ${actual - expectedValue} \n` +
            `  Tolorance: ${tolerance}`,
        )
      }
    }
  })
})
