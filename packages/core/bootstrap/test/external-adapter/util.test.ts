import { AdapterRequest } from '@chainlink/types'
import { expect } from 'chai'
import * as util from '../../src/lib/external-adapter/util'

describe('Bootstrap/External Adapter', () => {
  describe('Get Feed Name', () => {
    it(`Gets the correct feed name with valid input`, () => {
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

    it(`Gets the correct feed name with any base/quote combination`, () => {
      const input: AdapterRequest = {
        id: '1',
        data: {
          symbol: 'ETH',
          to: 'USD',
        },
      }
      let feedName = util.getFeedId(input)
      expect(feedName).to.be.eq('ETH/USD')

      const input2: AdapterRequest = {
        id: '1',
        data: {
          asset: 'ETH',
          to: 'USD',
        },
      }
      feedName = util.getFeedId(input2)
      expect(feedName).to.be.eq('ETH/USD')

      const input3: AdapterRequest = {
        id: '1',
        data: {
          symbol: 'ETH',
          convert: 'USD',
        },
      }
      feedName = util.getFeedId(input3)
      expect(feedName).to.be.eq('ETH/USD')
    })

    it(`Returns jobId if no match`, () => {
      const input: AdapterRequest = {
        id: '10',
        data: {},
      }
      const feedName = util.getFeedId(input)
      expect(feedName).to.be.eq('10')
    })

    it(`Returns jobID as 1 if anything match`, () => {
      const input: AdapterRequest = {
        id: String(),
        data: {},
      }
      const feedName = util.getFeedId(input)
      expect(feedName).to.be.eq('1')
    })
  })
})
