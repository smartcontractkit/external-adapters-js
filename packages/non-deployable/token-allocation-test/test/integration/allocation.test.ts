import nock from 'nock'
import * as process from 'process'
import { getTotalAllocations } from '../../src'
import { mockSourceEAResponse } from './fixtures'

describe('execute', () => {
  const allocations = [
    {
      symbol: 'wBTC',
      balance: 100000000,
      decimals: 8,
    },
    {
      symbol: 'DAI',
      balance: '1000000000000000000',
    },
  ]
  const SOURCE_EA_URL = 'http://localhost:8081'

  afterAll(() => {
    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
  })

  describe('price method', () => {
    mockSourceEAResponse(SOURCE_EA_URL)

    it(`should return the correct data for price method`, async () => {
      const resp = await getTotalAllocations({
        allocations,
        sourceUrl: SOURCE_EA_URL,
      })
      expect(resp.result).toBe(260.54)
      expect(resp).toMatchSnapshot()
    })

    it(`should return the correct data for price method with explicit quote and method`, async () => {
      const resp = await getTotalAllocations({
        allocations,
        sourceUrl: SOURCE_EA_URL,
        method: 'price',
        quote: 'EUR',
      })
      expect(resp.result).toBe(260.54)
      expect(resp).toMatchSnapshot()
    })
  })

  describe('marketcap method', () => {
    mockSourceEAResponse(SOURCE_EA_URL, 'marketcap')

    it(`should return the correct data for marketcap method`, async () => {
      const resp = await getTotalAllocations({
        allocations,
        sourceUrl: SOURCE_EA_URL,
        method: 'marketcap',
      })
      expect(resp.result).toBe(260.54)
      expect(resp).toMatchSnapshot()
    })

    it(`should return the correct data for marketcap method with explicit quote`, async () => {
      const resp = await getTotalAllocations({
        allocations,
        sourceUrl: SOURCE_EA_URL,
        method: 'marketcap',
        quote: 'EUR',
      })
      expect(resp.result).toBe(260.54)
      expect(resp).toMatchSnapshot()
    })
  })
})
