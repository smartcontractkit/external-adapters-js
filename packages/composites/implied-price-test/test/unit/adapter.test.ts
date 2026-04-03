import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import Decimal from 'decimal.js'
import { validateDecimalsParams } from '../../src/endpoint/computedPrice'
import { calculateMedian } from '../../src/transport/utils'

describe('calculateMedian', () => {
  it('gets the median of a list of numbers', () => {
    expect(calculateMedian([new Decimal(1), new Decimal(2), new Decimal(3)]).toNumber()).toEqual(2)
  })

  it('gets the median with only one number', () => {
    expect(calculateMedian([new Decimal(1)]).toNumber()).toEqual(1)
  })

  it('gets the median with an even amount of numbers', () => {
    expect(calculateMedian([new Decimal(1), new Decimal(2)]).toNumber()).toEqual(1.5)
  })
})

describe('validateDecimalsParams', () => {
  it('should not throw when all decimals are defined', () => {
    expect(() => validateDecimalsParams(18, 8, 6)).not.toThrow()
  })

  it('should not throw when all decimals are undefined', () => {
    expect(() => validateDecimalsParams(undefined, undefined, undefined)).not.toThrow()
  })

  it('should throw when two decimals are defined and one is undefined', () => {
    expect(() => validateDecimalsParams(18, 8, undefined)).toThrow(AdapterInputError)
    expect(() => validateDecimalsParams(18, undefined, undefined)).toThrow(AdapterInputError)
    expect(() => validateDecimalsParams(undefined, 8, 6)).toThrow(AdapterInputError)
  })
})
