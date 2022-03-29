import { AdapterContext, AdapterRequest, Execute } from '@chainlink/types'
import { useFakeTimers } from 'sinon'
import { AdapterCache, defaultOptions, withCache } from '../../src/lib/middleware/cache'
import { LocalLRUCache } from '../../src/lib/middleware/cache/local'

const mockCacheKey = 'mockCacheKey'
const mockBatchCacheKey = 'mockBatchCacheKey'

const callAndExpect = async (fn: any, n: number, result: any) => {
  while (n--) {
    const { data } = await fn({
      debug: { cacheKey: mockCacheKey, batchCacheKey: mockBatchCacheKey },
    })
    if (n === 0) expect(data.result).toBe(result)
  }
}

// Helper test function: a stateful counter
const counterFrom =
  (i = 0, data = {}): Execute =>
  async (request) => {
    const result = i++
    return {
      jobRunID: request.id,
      data: {
        jobRunID: request.id,
        statusCode: 200,
        debug: { cacheKey: mockCacheKey },
        data: request,
        result,
        ...data,
      },
      result,
      statusCode: 200,
    }
  }

describe('cache', () => {
  afterEach(() => {
    // We need to reset the local cache instance after each test so that we can start a fresh test with notihing cached
    LocalLRUCache.cacheInstance = null
  })

  describe('options defaults', () => {
    beforeEach(() => {
      delete process.env.CACHE_ENABLED
      delete process.env.CACHE_MAX_AGE
    })

    it(`configures env options with cache enabled: true`, () => {
      const options = defaultOptions()
      expect(options).toHaveProperty('enabled', true)
    })

    it(`configures env options with default maxAge: 1000 * 60 * 1.5`, () => {
      const options = defaultOptions()
      expect(options.cacheImplOptions).toHaveProperty('maxAge', 1000 * 60 * 1.5)
    })
  })

  describe('disabled', () => {
    const context: AdapterContext = {
      cache: null,
    }

    beforeEach(async () => {
      process.env.CACHE_ENABLED = 'false'
      const cacheOptions = defaultOptions()
      if (cacheOptions.enabled) {
        cacheOptions.instance = await cacheOptions.cacheBuilder(cacheOptions.cacheImplOptions)
        context.cache = cacheOptions
      }
    })

    it(`does not cache`, async () => {
      const counter = await withCache()(counterFrom(1), context)
      await callAndExpect(counter, 3, 3)
      await callAndExpect(counter, 3, 6)
      await callAndExpect(counter, 3, 9)
      await callAndExpect(counter, 3, 12)
    })
  })

  describe('enabled', () => {
    const context: AdapterContext = {}
    let clock: sinon.SinonFakeTimers
    beforeEach(async () => {
      process.env.CACHE_ENABLED = 'true'
      const options = defaultOptions()
      context.cache = {
        ...defaultOptions(),
        instance: await options.cacheBuilder(options.cacheImplOptions),
      }
      clock = useFakeTimers()
    })

    afterEach(() => {
      jest.restoreAllMocks()
      clock.restore()
    })

    it(`caches fn result`, async () => {
      const counter = await withCache()(counterFrom(0), context)
      await callAndExpect(counter, 3, 0)
    })

    it(`caches fn result - while entry still young  (under 30s default)`, async () => {
      const counter = await withCache()(counterFrom(0), context)
      await callAndExpect(counter, 3, 0)
      await callAndExpect(counter, 3, 0)

      clock.tick(1000)
      await callAndExpect(counter, 3, 0)
      await callAndExpect(counter, 3, 0)

      clock.tick(1000 * 5)
      await callAndExpect(counter, 3, 0)
      await callAndExpect(counter, 3, 0)
    })

    it(`invalidates cache - after configured minimum maxAge of 35s`, async () => {
      context.cache.minimumAge = 1000 * 35

      const counter = await withCache()(counterFrom(0), context)
      await callAndExpect(counter, 3, 0)

      clock.tick(1000 * 30 + 1)
      await callAndExpect(counter, 1, 0)

      clock.tick(1000 * 5 + 1) // extra 1ms
      await callAndExpect(counter, 1, 1)
      await callAndExpect(counter, 1000, 1)

      clock.tick(1000 * 35 + 1) // extra 1ms
      await callAndExpect(counter, 1, 2)
    })

    it(`will not set a TTL lower than default minimum TTL of 30s`, async () => {
      const counter = await withCache()(counterFrom(0, { maxAge: 1000 * 10 }), context)
      await callAndExpect(counter, 3, 0)

      clock.tick(1000 * 5)
      await callAndExpect(counter, 1, 0)

      clock.tick(1000 * 5 + 1) // extra 1ms
      await callAndExpect(counter, 1, 0)
      await callAndExpect(counter, 1000, 0)

      clock.tick(1000 * 30 + 1) // extra 1ms
      await callAndExpect(counter, 1, 1)
    })

    it(`handles failed cache read, bypasses local and executes`, async () => {
      jest.spyOn(AdapterCache.prototype, 'getResultForRequest').mockImplementation(() => {
        throw 'asd'
      })
      const request: AdapterRequest = {
        id: '1',
        data: {},
        debug: { cacheKey: mockCacheKey, batchCacheKey: mockBatchCacheKey },
      }
      const response = {
        jobRunID: '1',
        data: { jobRunID: '1', statusCode: 200, data: {}, result: 123 },
        result: 123,
        statusCode: 200,
      }
      const execute = async () => response
      const middleware = await withCache()(execute, context)
      const result = await middleware(request, {})
      expect(result).toBe(response)
    })

    it(`handles failed cache read, bypasses local and executes but gets no response`, async () => {
      jest.spyOn(AdapterCache.prototype, 'getResultForRequest').mockImplementation(() => {
        throw 'asd'
      })
      const request: AdapterRequest = {
        id: '1',
        data: {},
        debug: { cacheKey: mockCacheKey, batchCacheKey: mockBatchCacheKey },
      }
      const execute = async () => null
      const middleware = await withCache()(execute, context)
      const result = await middleware(request, {})
      expect(result).toBe(null)
    })

    it(`parses batch results from successful response`, async () => {
      jest.spyOn(AdapterCache.prototype, 'getResultForRequest').mockImplementation(() => {
        throw 'asd'
      })
      const makeRequest = (id: string): AdapterRequest => ({
        id,
        data: {},
        debug: { cacheKey: mockCacheKey, batchCacheKey: mockBatchCacheKey },
      })
      const response = {
        jobRunID: '1',
        data: {
          data: {},
          results: {
            btc: [makeRequest('1'), 123],
            eth: [makeRequest('2'), 234],
          },
        },
        result: null,
        statusCode: 200,
      }
      const execute = jest.fn().mockReturnValueOnce(null).mockReturnValueOnce(response)
      const middleware = await withCache()(execute, context)
      const result = await middleware(makeRequest('3'), {})
      expect(result).toEqual({
        ...response,
        debug: {
          performance: 0,
          providerCost: 1,
          staleness: 0,
        },
      })
    })

    it(`fails to parse batch results from successful response, returns result`, async () => {
      jest.spyOn(AdapterCache.prototype, 'getResultForRequest').mockImplementation(() => {
        throw 'asd'
      })
      const makeRequest = (id: string): AdapterRequest => ({
        id,
        data: {},
        debug: { cacheKey: mockCacheKey, batchCacheKey: mockBatchCacheKey },
      })
      const response = {
        jobRunID: '1',
        data: {
          data: {},
          results: {
            btc: 123,
            eth: 234,
          },
        },
        result: null,
        statusCode: 200,
      }
      const execute = jest.fn().mockReturnValueOnce(null).mockReturnValueOnce(response)
      const middleware = await withCache()(execute, context)
      const result = await middleware(makeRequest('3'), {})
      expect(result).toBe(response)
    })

    it(`successfully coalesces requests`, async () => {
      context.cache.requestCoalescing = {
        ...context.cache.requestCoalescing,
        enabled: true,
        entropyMax: 10,
      }
      const makeRequest = (id: string): AdapterRequest => ({
        id,
        data: {},
        debug: { cacheKey: mockCacheKey, batchCacheKey: mockBatchCacheKey },
      })
      const response = {
        jobRunID: '1',
        data: {
          data: {},
          result: 123,
        },
        result: null,
        statusCode: 200,
      }
      const execute = jest.fn().mockReturnValueOnce(null).mockReturnValueOnce(response)
      const middleware = await withCache()(execute, context)

      // Make a request, tick 10ms, then make another that will be coalesced with the first one.
      // Then, tick a bunch so all the timeouts complete. This is to guarantee ordering and
      // make the test as deterministic as possible.
      middleware(makeRequest('3'), {})
      await clock.tickAsync(10)
      const promise = middleware(makeRequest('4'), {})
      await clock.tickAsync(10000)
      const result = await promise

      // Remove debug performance, it's not deterministic even with a fixed clock
      expect(typeof result.debug.performance).toBe('number')
      expect(result.debug.performance).toBeGreaterThan(0)
      delete result.debug.performance

      expect(await promise).toEqual({
        ...response,
        debug: {
          providerCost: 1,
          staleness: 0,
        },
      })
      expect(execute.mock.calls.length).toBe(2)
    })
  })
})
