import { median, parseSources } from '../../src/endpoint/impliedPrice'
import * as endpoints from '../../src/endpoint'
import testPayload from '../../test-payload.json'

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

describe('test-payload.json', () => {
  it('should contain all endpoints/aliases', () => {
    const endpointsWithAliases = Object.keys(endpoints)
      .map((e) => [...(endpoints[e as keyof typeof endpoints].supportedEndpoints || [])])
      .flat()
    endpointsWithAliases.forEach((alias) => {
      const requests = testPayload.requests as { endpoint?: string }[]
      const aliasedRequest = requests.find((req) => req?.endpoint === alias)
      expect(aliasedRequest).toBeDefined()
    })
  })
})
