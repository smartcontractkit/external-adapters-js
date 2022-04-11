import { AdapterRequest } from '@chainlink/types'
import * as util from '../../../src/lib/metrics/util'

describe('Bootstrap/Metrics Utils', () => {
  describe('Get Feed ID', () => {
    it(`Gets the correct feed id with valid input`, () => {
      const input: AdapterRequest = {
        id: '1',
        data: {
          base: 'ETH',
          quote: 'USD',
        },
      }
      const feedName = util.getFeedId(input)
      expect(feedName).toBe('ETH/USD')
    })

    it(`Returns an MD5 hash when the length is exceeded`, () => {
      const input: AdapterRequest = {
        id: '1',
        data: {
          test: Array(util.MAX_FEED_ID_LENGTH).fill('TEST'),
        },
      }
      const feedName = util.getFeedId(input)
      expect(feedName).toBe('bbf37d01b4ad1e0649f514db3493bcc7')
    })

    it(`Gets the correct feed id with any base/quote combination`, () => {
      const input: AdapterRequest = {
        id: '1',
        data: {
          symbol: 'eth',
          to: 'usd',
        },
      }
      let feedName = util.getFeedId(input)
      expect(feedName).toBe('ETH/USD')

      const input2: AdapterRequest = {
        id: '1',
        data: {
          asset: 'ETH',
          to: 'usd',
        },
      }
      feedName = util.getFeedId(input2)
      expect(feedName).toBe('ETH/USD')

      const input3: AdapterRequest = {
        id: '1',
        data: {
          symbol: 'eth',
          convert: 'USD',
        },
      }
      feedName = util.getFeedId(input3)
      expect(feedName).toBe('ETH/USD')
    })

    it(`Returns stringify input if no match`, () => {
      const input: AdapterRequest = {
        id: '10',
        data: {},
      }
      const feedName = util.getFeedId(input)
      expect(feedName).toMatchInlineSnapshot(`"{\\"data\\":{}}"`)
    })

    it(`Returns stringify input if anything match`, () => {
      const input: AdapterRequest = {
        id: '',
        data: {},
      }
      const feedName = util.getFeedId(input)
      expect(feedName).toMatchInlineSnapshot(`"{\\"data\\":{}}"`)
    })

    it(`Does not throw error if pricefeed parameters are missing`, () => {
      const input: AdapterRequest = {
        id: '',
        data: {},
      }
      expect(() => {
        util.getFeedId(input)
      }).not.toThrow()
    })

    it(`Correctly handles arrays in base/quote parameters`, () => {
      const input1: AdapterRequest = {
        id: '1',
        data: {
          base: ['BTC', 'ETH', 'DOGE'], // Tests sorting as well
          quote: 'USD',
        },
      }
      let feedName = util.getFeedId(input1)
      expect(feedName).toBe('[BTC|DOGE|ETH]/USD')

      const input2: AdapterRequest = {
        id: '1',
        data: {
          base: ['BTC'],
          quote: ['USD'],
        },
      }
      feedName = util.getFeedId(input2)
      expect(feedName).toBe('BTC/USD')
    })

    it(`Returns fixed feed id when debug warmer property is set to true`, () => {
      const input: AdapterRequest = {
        id: '1',
        data: {
          base: ['BTC', 'ETH', 'DOGE'],
          quote: 'USD',
        },
        debug: {
          warmer: true,
        },
      }
      const feedName = util.getFeedId(input)
      expect(feedName).toBe('CACHE_WARMER')
    })

    it(`Returns input as JSON string when validation fails`, () => {
      const input: AdapterRequest = {
        id: '1',
        data: {
          base: '',
          quote: '',
        },
      }
      const feedName = util.getFeedId(input)
      expect(feedName).toBe('{"id":"1","data":{"base":"","quote":""}}')
    })

    it(`Returns 'undefined' when an error is caught`, () => {
      const input: AdapterRequest = {
        id: '1',
        data: undefined,
      }
      const feedName = util.getFeedId(input)
      expect(feedName).toBe('undefined')
    })
  })
})
