import { parseSources } from '../../src/adapter'

describe('parseSources', () => {
  it('parses an array of sources', () => {
    expect(parseSources(['coingecko', 'conmarketcap'])).toEqual(['coingecko', 'conmarketcap'])
  })

  it('parses a list of sources', () => {
    expect(parseSources('coingecko,conmarketcap')).toEqual(['coingecko', 'conmarketcap'])
  })
})
