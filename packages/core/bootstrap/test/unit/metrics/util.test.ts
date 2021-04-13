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
      expect(feedName).toBe(JSON.stringify(input))
    })

    it(`Returns stringify input if anything match`, () => {
      const input: AdapterRequest = {
        id: String(),
        data: {},
      }
      const feedName = util.getFeedId(input)
      expect(feedName).toBe(JSON.stringify(input))
    })

    it(`Does not throw error if pricefeed parameters are missing`, () => {
      const input: AdapterRequest = {
        id: String(),
        data: {},
      }
      expect(() => {
        util.getFeedId(input)
      }).not.toThrow()
    })
  })
})
