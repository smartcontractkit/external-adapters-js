import { median, parseSources } from '../../src/endpoint/computedPrice'

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
