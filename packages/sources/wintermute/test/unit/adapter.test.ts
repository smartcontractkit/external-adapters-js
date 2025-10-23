import { options, WSResponse } from '../../src/transport/price'

describe('Wintermute WebSocketTransport - Unit', () => {
  describe('builders', () => {
    it('should build subscribe message correctly', () => {
      const msg = options.builders!.subscribeMessage({ index: 'GMCI30' }, {})
      expect(msg).toEqual({
        op: 'subscribe',
        args: ['price.gmci30'],
      })
    })

    it('should build unsubscribe message correctly', () => {
      const msg = options.builders!.unsubscribeMessage({ index: 'GMCI30' }, {})
      expect(msg).toEqual({
        op: 'unsubscribe',
        args: ['price.gmci30'],
      })
    })
  })

  describe('handlers.message', () => {
    const messageHandler = options.handlers.message!

    it('should return undefined for unsuccessful message', () => {
      const msg: WSResponse = { success: false, data: [], topic: 'price' }
      const result = messageHandler(msg)
      expect(result).toBeUndefined()
    })

    it('should parse valid price messages correctly', () => {
      const msg: WSResponse = {
        success: true,
        topic: 'price',
        data: [{ last_updated: '2025-10-21T21:27:11.498199Z', price: 202.22, symbol: 'GMCI30' }],
      }
      const result = messageHandler(msg)
      expect(result).toHaveLength(1)
      const item = result![0]
      expect(item.params).toEqual({ index: 'GMCI30' })
      expect(item.response.data.symbol).toBe('GMCI30')
      expect(item.response.data.result).toBe(202.22)
    })

    it('should ignore non-price topics', () => {
      const msg: WSResponse = {
        success: true,
        topic: 'rebalance_status',
        data: [],
      }
      const result = messageHandler(msg)
      expect(result).toEqual([])
    })
  })
})
