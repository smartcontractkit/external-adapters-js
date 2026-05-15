import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { StockCache } from '../../src/transport/stock-cache'

LoggerFactoryProvider.set()

describe('StockCache', () => {
  const streamId = 'stream-1'

  describe('processBidAsk', () => {
    it('stores bid and ask with provider time in ms', () => {
      const now = Date.now()
      const cache = new StockCache()
      cache.processBidAsk(
        streamId,
        { value: 100, size: 10, unixTimestamp: now / 1000 },
        { value: 102, size: 5, unixTimestamp: now / 1000 },
      )

      expect(cache.bidCache.get(streamId)).toEqual({ price: 100, volume: 10, time: now })
      expect(cache.askCache.get(streamId)).toEqual({ price: 102, volume: 5, time: now })
    })

    it('does not store when price or volume is missing', () => {
      const cache = new StockCache()
      cache.processBidAsk(streamId, { value: 1 }, { size: 2 })
      expect(cache.bidCache.has(streamId)).toBe(false)
      expect(cache.askCache.has(streamId)).toBe(false)
    })

    it('does not store when message is too old', () => {
      const cache = new StockCache()

      const old = Date.now() / 1000 - 305
      cache.processBidAsk(
        streamId,
        { value: 100, size: 10, unixTimestamp: old },
        { value: 102, size: 5, unixTimestamp: old },
      )
      expect(cache.bidCache.has(streamId)).toBe(false)
      expect(cache.askCache.has(streamId)).toBe(false)

      const notOld = Date.now() / 1000 - 295
      cache.processBidAsk(
        streamId,
        { value: 100, size: 10, unixTimestamp: notOld },
        { value: 102, size: 5, unixTimestamp: notOld },
      )
      expect(cache.bidCache.has(streamId)).toBe(true)
      expect(cache.askCache.has(streamId)).toBe(true)
    })

    it('does not store NaN price or volume', () => {
      const cache = new StockCache()
      cache.processBidAsk(streamId, { value: NaN, size: 1 }, { value: 1, size: NaN })
      expect(cache.bidCache.has(streamId)).toBe(false)
      expect(cache.askCache.has(streamId)).toBe(false)
    })

    it('allows zero price and volume and no timestamp', () => {
      const cache = new StockCache()
      cache.processBidAsk(streamId, { value: 0, size: 0 }, { value: 0, size: 0 })
      expect(cache.bidCache.get(streamId)).toEqual({ price: 0, volume: 0 })
      expect(cache.askCache.get(streamId)).toEqual({ price: 0, volume: 0 })
    })
  })

  describe('getPriceResponse', () => {
    it('returns adapter response successfully', () => {
      const now = Date.now()
      const cache = new StockCache()
      expect(cache.getPriceResponse(streamId, { value: 55.5, unixTimestamp: now / 1000 })).toEqual([
        {
          params: { base: streamId, rawEndpoint: 'stock' },
          response: {
            result: 55.5,
            data: { result: 55.5 },
            timestamps: { providerIndicatedTimeUnixMs: now },
          },
        },
      ])
    })

    it('no timestamps when missing unixTimestamp', () => {
      const cache = new StockCache()
      expect(cache.getPriceResponse(streamId, { value: 10 })).toEqual([
        {
          params: { base: streamId, rawEndpoint: 'stock' },
          response: { result: 10, data: { result: 10 } },
        },
      ])
    })

    it('returns empty array when last value is missing or NaN', () => {
      const cache = new StockCache()
      expect(cache.getPriceResponse(streamId, undefined)).toEqual([])
      expect(cache.getPriceResponse(streamId, {})).toEqual([])
      expect(cache.getPriceResponse(streamId, { value: NaN })).toEqual([])
    })

    it('returns empty array when message is too old', () => {
      const cache = new StockCache()
      expect(
        cache.getPriceResponse(streamId, {
          value: 55.5,
          unixTimestamp: Date.now() / 1000 - 295,
        }).length,
      ).toBeGreaterThan(0)
      expect(
        cache.getPriceResponse(streamId, {
          value: 55.5,
          unixTimestamp: Date.now() / 1000 - 305,
        }).length,
      ).toEqual(0)
    })
  })

  describe('getBidAskResponse', () => {
    it('returns mid, sides, volumes, and max provider time', () => {
      const now = Date.now()
      const cache = new StockCache()
      cache.processBidAsk(
        streamId,
        { value: 100, size: 10, unixTimestamp: now / 1000 },
        { value: 104, size: 4, unixTimestamp: now / 1000 },
      )

      expect(cache.getBidAskResponse(streamId)).toEqual([
        {
          params: { base: streamId, rawEndpoint: 'stock_quotes' },
          response: {
            result: null,
            data: {
              mid_price: 102,
              bid_price: 100,
              bid_volume: 10,
              ask_price: 104,
              ask_volume: 4,
            },
            timestamps: { providerIndicatedTimeUnixMs: now },
          },
        },
      ])
    })

    it('returns mid, sides, volumes, and max provider time - update seperately', () => {
      const now = Date.now()
      const cache = new StockCache()
      cache.processBidAsk(streamId, { value: 100, size: 10, unixTimestamp: now / 1000 })
      cache.processBidAsk(streamId, undefined, {
        value: 104,
        size: 4,
        unixTimestamp: (now * 10) / 1000,
      })

      expect(cache.getBidAskResponse(streamId)).toEqual([
        {
          params: { base: streamId, rawEndpoint: 'stock_quotes' },
          response: {
            result: null,
            data: {
              mid_price: 102,
              bid_price: 100,
              bid_volume: 10,
              ask_price: 104,
              ask_volume: 4,
            },
            timestamps: { providerIndicatedTimeUnixMs: now * 10 },
          },
        },
      ])
    })

    it('refreshes bid only when there is a bid update', () => {
      const now = Date.now()
      const cache = new StockCache()
      cache.processBidAsk(
        streamId,
        { value: 100, size: 10, unixTimestamp: now / 1000 },
        { value: 104, size: 4, unixTimestamp: now / 1000 },
      )

      cache.processBidAsk(streamId, { value: 1000, size: 100, unixTimestamp: (now * 10) / 1000 })

      expect(cache.getBidAskResponse(streamId)).toEqual([
        {
          params: { base: streamId, rawEndpoint: 'stock_quotes' },
          response: {
            result: null,
            data: {
              mid_price: 552,
              bid_price: 1000,
              bid_volume: 100,
              ask_price: 104,
              ask_volume: 4,
            },
            timestamps: { providerIndicatedTimeUnixMs: now * 10 },
          },
        },
      ])
    })

    it('uses ask price as mid when bid is zero', () => {
      const now = Date.now()
      const cache = new StockCache()
      cache.processBidAsk(
        streamId,
        { value: 0, size: 1, unixTimestamp: now / 1000 },
        { value: 200, size: 1, unixTimestamp: now / 1000 },
      )
      const [row] = cache.getBidAskResponse(streamId)
      expect(row.response.data.mid_price).toBe(200)
    })

    it('uses bid price as mid when ask is zero', () => {
      const now = Date.now()
      const cache = new StockCache()
      cache.processBidAsk(
        streamId,
        { value: 100, size: 1, unixTimestamp: now / 1000 },
        { value: 0, size: 1, unixTimestamp: now / 1000 },
      )
      const [row] = cache.getBidAskResponse(streamId)
      expect(row.response.data.mid_price).toBe(100)
    })

    it('returns empty array when bid is missing', () => {
      const cache = new StockCache()
      cache.processBidAsk(streamId, { value: 1, size: 1 }, undefined)
      expect(cache.getBidAskResponse(streamId)).toEqual([])
    })

    it('returns empty array when ask is missing', () => {
      const cache = new StockCache()
      cache.processBidAsk(streamId, undefined, { value: 2, size: 2 })
      expect(cache.getBidAskResponse(streamId)).toEqual([])
    })

    it('omits timestamps when neither side has provider time', () => {
      const cache = new StockCache()
      cache.processBidAsk(streamId, { value: 10, size: 1 }, { value: 20, size: 1 })
      const [row] = cache.getBidAskResponse(streamId)
      expect(row.response).not.toHaveProperty('timestamps')
    })

    it('use bid timestamps if ask timestamp is missing', () => {
      const now = Date.now()
      const cache = new StockCache()
      cache.processBidAsk(
        streamId,
        { value: 10, size: 1, unixTimestamp: now / 1000 },
        { value: 20, size: 1 },
      )
      const [row] = cache.getBidAskResponse(streamId)
      expect(row.response.timestamps).toEqual({ providerIndicatedTimeUnixMs: now })
    })
  })
})
