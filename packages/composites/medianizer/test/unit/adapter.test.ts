import { median, parseSources } from '../../src/adapter'

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
    expect(median([1, 2, 3])).toEqual(2)
  })

  it('gets the median with only one number', () => {
    expect(median([1])).toEqual(1)
  })

  it('gets the median with an even amount of numbers', () => {
    expect(median([1, 2])).toEqual(1.5)
  })
})
