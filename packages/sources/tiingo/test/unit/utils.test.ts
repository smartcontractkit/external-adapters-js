import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import { tiingoCommonSubscriptionRequestTransform } from '../../src/endpoint/utils'

describe('endpoint utils', () => {
  describe('tiingoCommonSubscriptionRequestTransform', () => {
    it('lowercases the request base and quote in place', () => {
      const requestContextData = { base: 'EtH', quote: 'UsD' }
      const req = {
        requestContext: {
          data: requestContextData,
        },
      } as AdapterRequest<{ base: string; quote: string }>

      tiingoCommonSubscriptionRequestTransform(req)

      expect(req.requestContext.data).toBe(requestContextData)
      expect(req.requestContext.data).toEqual({ base: 'eth', quote: 'usd' })
    })

    it('leaves already lowercase pairs unchanged', () => {
      const requestContextData = { base: 'btc', quote: 'eur' }
      const req = {
        requestContext: {
          data: requestContextData,
        },
      } as AdapterRequest<{ base: string; quote: string }>

      tiingoCommonSubscriptionRequestTransform(req)

      expect(req.requestContext.data).toBe(requestContextData)
      expect(req.requestContext.data).toEqual({ base: 'btc', quote: 'eur' })
    })
  })
})
