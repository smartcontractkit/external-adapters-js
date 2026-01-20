import { parseUnits } from 'ethers'
import * as fs from 'fs'
import * as path from 'path'
import { processUpdate } from '../../../../src/lib/smoother/smoother'

describe('EmaSmoother', () => {
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
    const secondResult = processUpdate('ema', 'test3', 150n, spread, 0)
    expect(secondResult.price).toBeGreaterThan(100n) // Should move toward 150
    expect(secondResult.price).toBeLessThan(150n) // But not reach it immediately
    expect(secondResult.x).toBe(100n) // Previous state should be first result's price
  })

  it('Handle real world data', () => {
    const data = fs
      .readFileSync(path.join(__dirname, 'ema_smoother_sample.csv'), 'utf8')
      .split('\n')
      .map((line) => line.split(','))

    const boundary = 1766437200

    for (const [price, timestamp, expected] of data) {
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
