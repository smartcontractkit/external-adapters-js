import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { options, WSResponse, WsTransportTypes } from '../../src/transport/price'
describe('Wintermute WebSocketTransport - Unit', () => {
  describe('builders', () => {
    const context = {} as EndpointContext<WsTransportTypes>

    it('should build subscribe message correctly', () => {
      if (!options || !options.builders || !options.builders.subscribeMessage) {
        throw new Error('subscribeMessage is undefined, cannot run test')
      }

      const message = options.builders.subscribeMessage!({ symbol: 'GMCI30' }, context) as any
      expect(message).toEqual({
        op: 'subscribe',
        args: ['price.gmci30'],
      })
    })

    it('should build unsubscribe message correctly', () => {
      if (!options || !options.builders || !options.builders.unsubscribeMessage) {
        throw new Error('subscribeMessage is undefined, cannot run test')
      }

      const msg = options.builders.unsubscribeMessage({ symbol: 'GMCI30' }, context)
      expect(msg).toEqual({
        op: 'unsubscribe',
        args: ['price.gmci30'],
      })
    })
  })

  describe('handlers.message', () => {
    const messageHandler = options.handlers.message!
    const context = {} as EndpointContext<WsTransportTypes>

    it('should return undefined for unsuccessful message', () => {
      const msg: WSResponse = { success: false, data: [], topic: 'price' }
      const result = messageHandler(msg, context)
      expect(result).toBeUndefined()
    })

    it('should parse valid price messages correctly', () => {
      const msg: WSResponse = {
        success: true,
        topic: 'price',
        data: [{ last_updated: '2025-10-21T21:27:11.498199Z', price: 202.22, symbol: 'GMCI30' }],
      }
      const result = messageHandler(msg, context)
      expect(result).toHaveLength(1)
      const item = result![0]
      expect(item.params).toEqual({ index: 'GMCI30' })
      expect(item.response?.data?.symbol).toBe('GMCI30')
      expect(item.response?.data?.result).toBe(202.22)
    })

    it('should ignore non-price topics', () => {
      const msg: WSResponse = {
        success: true,
        topic: 'rebalance_status',
        data: [],
      }
      const result = messageHandler(msg, context)
      expect(result).toEqual([])
    })
  })
})
