import {
  add,
  divide,
  fixedPointToNumber,
  getFixedPointFromResult,
  multiply,
  toFixedPointWithDecimals,
} from '../../src/utils/fixed-point'

describe('fixed-point', () => {
  describe('toFixedPointWithDecimals', () => {
    it('should convert a number to a fixed point number', () => {
      expect(toFixedPointWithDecimals(1, 6)).toEqual({
        amount: 1_000_000n,
        decimals: 6,
      })

      expect(toFixedPointWithDecimals(123, 6)).toEqual({
        amount: 123_000_000n,
        decimals: 6,
      })

      expect(toFixedPointWithDecimals(1.23, 6)).toEqual({
        amount: 1_230_000n,
        decimals: 6,
      })

      expect(toFixedPointWithDecimals(1.23456789, 18)).toEqual({
        amount: 1_234_567_890_000_000_000n,
        decimals: 18,
      })

      expect(toFixedPointWithDecimals(123000, 2)).toEqual({
        amount: 12_300_000n,
        decimals: 2,
      })
    })

    it('should truncate extra decimals', () => {
      expect(toFixedPointWithDecimals(1.23456, 2)).toEqual({
        amount: 123n,
        decimals: 2,
      })

      expect(toFixedPointWithDecimals(9.87654, 2)).toEqual({
        amount: 987n,
        decimals: 2,
      })

      expect(toFixedPointWithDecimals(-1.23456, 2)).toEqual({
        amount: -123n,
        decimals: 2,
      })

      expect(toFixedPointWithDecimals(-9.87654, 2)).toEqual({
        amount: -987n,
        decimals: 2,
      })
    })

    it('should increase decimals on a fixed point number', () => {
      expect(toFixedPointWithDecimals({ amount: 123n, decimals: 2 }, 4)).toEqual({
        amount: 12_300n,
        decimals: 4,
      })
    })

    it('should decrease decimals on a fixed point number', () => {
      expect(toFixedPointWithDecimals({ amount: 12_300n, decimals: 4 }, 2)).toEqual({
        amount: 123n,
        decimals: 2,
      })
    })

    it('should truncate decimals on a fixed point number', () => {
      expect(toFixedPointWithDecimals({ amount: 12_345n, decimals: 4 }, 2)).toEqual({
        amount: 123n,
        decimals: 2,
      })
      expect(toFixedPointWithDecimals({ amount: 98_765n, decimals: 4 }, 2)).toEqual({
        amount: 987n,
        decimals: 2,
      })
    })

    it('should keep decimals the same on a fixed point number', () => {
      expect(toFixedPointWithDecimals({ amount: 123n, decimals: 2 }, 2)).toEqual({
        amount: 123n,
        decimals: 2,
      })
    })
  })

  describe('fixedPointToNumber', () => {
    it('should convert a fixed point number to a number', () => {
      expect(fixedPointToNumber({ amount: 1_230_000n, decimals: 6 })).toEqual(1.23)
      expect(fixedPointToNumber({ amount: 1_234_567_890_000_000_000n, decimals: 18 })).toEqual(
        1.23456789,
      )
      expect(fixedPointToNumber({ amount: 12_300_000n, decimals: 2 })).toEqual(123000)
    })

    it('should handle negative fixed point numbers', () => {
      expect(fixedPointToNumber({ amount: -1_230_000n, decimals: 6 })).toEqual(-1.23)
      expect(fixedPointToNumber({ amount: -1_234_567_890_000_000_000n, decimals: 18 })).toEqual(
        -1.23456789,
      )
      expect(fixedPointToNumber({ amount: -12_300_000n, decimals: 2 })).toEqual(-123000)
    })
  })

  describe('add', () => {
    it('should add two fixed point numbers with the same decimals', () => {
      expect(add({ amount: 123n, decimals: 2 }, { amount: 456n, decimals: 2 })).toEqual({
        amount: 579n,
        decimals: 2,
      })
    })

    it('should add two fixed point numbers with different decimals', () => {
      expect(add({ amount: 123n, decimals: 2 }, { amount: 45_600n, decimals: 4 })).toEqual({
        amount: 57_900n,
        decimals: 4,
      })
    })
  })

  describe('multiply', () => {
    it('should multiply two fixed point numbers', () => {
      expect(
        multiply({ amount: 3_000_000n, decimals: 6 }, { amount: 5_000_000n, decimals: 6 }),
      ).toEqual({
        amount: 15_000_000n,
        decimals: 6,
      })
    })

    it('should multiply two fixed point numbers with different decimals', () => {
      expect(
        multiply({ amount: 4_000_000n, decimals: 6 }, { amount: 6_000_000_000n, decimals: 9 }),
      ).toEqual({
        amount: 24_000_000_000n,
        decimals: 9,
      })
    })

    it('should truncate decimals if the result has more decimals than the inputs', () => {
      expect(
        multiply({ amount: 1_234_567n, decimals: 6 }, { amount: 9_876_543n, decimals: 6 }),
      ).toEqual({
        amount: 12_193_254n,
        decimals: 6,
      })
    })
  })

  describe('divide', () => {
    it('should divide two fixed point numbers', () => {
      expect(
        divide({ amount: 15_000_000n, decimals: 6 }, { amount: 5_000_000n, decimals: 6 }),
      ).toEqual({
        amount: 3_000_000n,
        decimals: 6,
      })

      expect(
        divide({ amount: 10_000_000n, decimals: 6 }, { amount: 3_000_000n, decimals: 6 }),
      ).toEqual({
        amount: 3_333_333n,
        decimals: 6,
      })
    })

    it('should divide two fixed point numbers with different decimals', () => {
      expect(
        divide({ amount: 24_000_000_000n, decimals: 9 }, { amount: 6_000_000n, decimals: 6 }),
      ).toEqual({
        amount: 4_000_000_000n,
        decimals: 9,
      })

      expect(
        divide({ amount: 10_000_000_000n, decimals: 9 }, { amount: 3_000n, decimals: 3 }),
      ).toEqual({
        amount: 3_333_333_333n,
        decimals: 9,
      })
    })
  })

  describe('getFixedPointFromResult', () => {
    it('should convert a result to a fixed point number', () => {
      expect(
        getFixedPointFromResult({
          result: {
            balance: '123000000',
            decimals: 6,
          },
          amountPath: 'balance',
          decimalsPath: 'decimals',
          defaultDecimals: 18,
        }),
      ).toEqual({
        amount: 123_000_000n,
        decimals: 6,
      })
    })

    it('should use defaultDecimals if decimalsPath is missing', () => {
      expect(
        getFixedPointFromResult({
          result: {
            balance: 1.23,
          },
          amountPath: 'balance',
          decimalsPath: undefined,
          defaultDecimals: 6,
        }),
      ).toEqual({
        amount: 1_230_000n,
        decimals: 6,
      })
    })

    it('should throw if result is missing amount', () => {
      expect(() =>
        getFixedPointFromResult({
          result: {
            reserves: 1.23,
          },
          amountPath: 'balance',
          decimalsPath: 'decimals',
          defaultDecimals: 6,
        }),
      ).toThrow("Amount not found at path 'balance'")
    })

    it('should throw if result is decimals', () => {
      expect(() =>
        getFixedPointFromResult({
          result: {
            balance: '123000000',
            decimals: 8,
          },
          amountPath: 'balance',
          decimalsPath: 'resultDecimals',
          defaultDecimals: 6,
        }),
      ).toThrow("Decimals not found at path 'resultDecimals'")
    })

    it('should access nested objects', () => {
      expect(
        getFixedPointFromResult({
          result: {
            data: {
              balance: '123000000',
              decimals: 6,
            },
          },
          amountPath: 'data.balance',
          decimalsPath: 'data.decimals',
          defaultDecimals: 18,
        }),
      ).toEqual({
        amount: 123_000_000n,
        decimals: 6,
      })
    })
  })
})
