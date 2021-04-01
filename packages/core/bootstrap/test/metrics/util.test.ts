import { AdapterRequest } from '@chainlink/types'
import { expect } from 'chai'
import * as util from '../../src/lib/metrics/util'

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
      expect(feedName).to.be.eq('ETH/USD')
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
      expect(feedName).to.be.eq('ETH/USD')

      const input2: AdapterRequest = {
        id: '1',
        data: {
          asset: 'ETH',
          to: 'usd',
        },
      }
      feedName = util.getFeedId(input2)
      expect(feedName).to.be.eq('ETH/USD')

      const input3: AdapterRequest = {
        id: '1',
        data: {
          symbol: 'eth',
          convert: 'USD',
        },
      }
      feedName = util.getFeedId(input3)
      expect(feedName).to.be.eq('ETH/USD')
    })

    it(`Returns stringify input if no match`, () => {
      const input: AdapterRequest = {
        id: '10',
        data: {},
      }
      const feedName = util.getFeedId(input)
      expect(feedName).to.be.eq(JSON.stringify(input))
    })

    it(`Returns stringify input if anything match`, () => {
      const input: AdapterRequest = {
        id: String(),
        data: {},
      }
      const feedName = util.getFeedId(input)
      expect(feedName).to.be.eq(JSON.stringify(input))
    })
  })
})
