import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import Decimal from 'decimal.js'
import { validateDecimalsFieldParams } from '../../src/endpoint/computedPrice'
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

describe('validateDecimalsFieldParams', () => {
  it('should not throw when all decimals fields and outputDecimals are defined', () => {
    expect(() => validateDecimalsFieldParams(18, 'decimals', 'decimals')).not.toThrow()
  })

  it('should not throw when all are undefined', () => {
    expect(() => validateDecimalsFieldParams(undefined, undefined, undefined)).not.toThrow()
  })

  it('should throw when outputDecimals is set but decimals fields are not', () => {
    expect(() => validateDecimalsFieldParams(18, undefined, 'decimals')).toThrow(AdapterInputError)
    expect(() => validateDecimalsFieldParams(18, 'decimals', undefined)).toThrow(AdapterInputError)
  })

  it('should throw when decimals fields are set but outputDecimals is not', () => {
    expect(() => validateDecimalsFieldParams(undefined, 'decimals', 'decimals')).toThrow(
      AdapterInputError,
    )
  })

  it('should not throw when operand decimals fields are numeric and all are defined', () => {
    expect(() => validateDecimalsFieldParams(18, 8, 18)).not.toThrow()
  })

  it('should throw when outputDecimals is set but numeric operand decimals fields are not', () => {
    expect(() => validateDecimalsFieldParams(18, undefined, 8)).toThrow(AdapterInputError)
    expect(() => validateDecimalsFieldParams(18, 8, undefined)).toThrow(AdapterInputError)
  })

  it('should use the custom errorMessage when provided', () => {
    const customMessage =
      'Intermediate check failed: response decimals fields should be all set or all unset'
    expect(() => validateDecimalsFieldParams(18, undefined, undefined, customMessage)).toThrow(
      expect.objectContaining({ message: customMessage }),
    )
  })

  it('should use the default errorMessage when not provided', () => {
    expect(() => validateDecimalsFieldParams(18, undefined, undefined)).toThrow(
      expect.objectContaining({ message: 'Decimals fields should be all set or all unset' }),
    )
  })
})
