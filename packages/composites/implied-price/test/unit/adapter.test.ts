import { AdapterInputError } from '@chainlink/ea-bootstrap'
import { median, parseSources, validateDecimalsParams } from '../../src/endpoint/computedPrice'

describe('parseSources', () => {
  it('parses an array of sources', () => {
    expect(parseSources(['coingecko', 'coinpaprika'])).toEqual(['coingecko', 'coinpaprika'])
  })

  it('parses a list of sources', () => {
    expect(parseSources('coingecko,coinpaprika')).toEqual(['coingecko', 'coinpaprika'])
  })
})

describe('median', () => {
  it('gets the median of a list of numbers', () => {
    expect(median([1, 2, 3]).toNumber()).toEqual(2)
  })

  it('gets the median with only one number', () => {
    expect(median([1]).toNumber()).toEqual(1)
  })

  it('gets the median with an even amount of numbers', () => {
    expect(median([1, 2]).toNumber()).toEqual(1.5)
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
