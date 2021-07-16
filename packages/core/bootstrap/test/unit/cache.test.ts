import { Execute } from '@chainlink/types'
import { useFakeTimers } from 'sinon'
import { CacheImplOptions, CacheOptions, defaultOptions, withCache } from '../../src/lib/cache'
import { LocalLRUCache } from '../../src/lib/cache/local'

const callAndExpect = async (fn: any, n: number, result: any) => {
  while (n--) {
    const { data } = await fn(0)
    if (n === 0) expect(data.result).toBe(result)
  }
}

// Helper test function: a stateful counter
const counterFrom = (i = 0, data = {}): Execute => async (request) => {
  const result = i++
  return {
    jobRunID: request.id,
    data: { jobRunID: request.id, statusCode: 200, data: request, result, ...data },
    result,
    statusCode: 200,
  }
}

// Build new cache every time
const cacheBuilder = async (options: CacheImplOptions) => new LocalLRUCache(options)

describe('cache', () => {
  describe('options defaults', () => {
    describe('ENV disabled', () => {
      beforeEach(() => {
        delete process.env.CACHE_ENABLED
      })

      it(`configures env options with cache enabled: false`, () => {
        const options = defaultOptions()
        expect(options).toHaveProperty('enabled', false)
      })
    })

    describe('ENV enabled', () => {
      beforeEach(() => {
        process.env.CACHE_ENABLED = 'true'
      })

      it(`configures env options with cache enabled: true`, () => {
        const options = defaultOptions()
        expect(options).toHaveProperty('enabled', true)
      })

      it(`configures env options with default maxAge: 1000 * 60 * 1.5`, () => {
        const options = defaultOptions()
        expect(options.cacheOptions).toHaveProperty('maxAge', 1000 * 60 * 1.5)
      })
    })
  })

  describe('disabled', () => {
    beforeEach(() => {
      delete process.env.CACHE_ENABLED
    })

    it(`does not cache`, async () => {
      const counter = await withCache(counterFrom(1))
      await callAndExpect(counter, 3, 3)
      await callAndExpect(counter, 3, 6)
      await callAndExpect(counter, 3, 9)
      await callAndExpect(counter, 3, 12)
    })
  })

  describe('enabled', () => {
    let options: CacheOptions
    let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      process.env.CACHE_ENABLED = 'true'
      options = { ...defaultOptions(), cacheBuilder }
      clock = useFakeTimers()
    })

    afterEach(() => {
      clock.restore()
    })

    it(`caches fn result`, async () => {
      const counter = await withCache(counterFrom(0), undefined, options)
      await callAndExpect(counter, 3, 0)
    })

    it(`caches fn result - while entry still young  (under 30s default)`, async () => {
      const counter = await withCache(counterFrom(0), undefined, options)
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
      options.minimumAge = 1000 * 35

      const counter = await withCache(counterFrom(0), undefined, options)
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
      const counter = await withCache(counterFrom(0, { maxAge: 1000 * 10 }), undefined, options)
      await callAndExpect(counter, 3, 0)

      clock.tick(1000 * 5)
      await callAndExpect(counter, 1, 0)

      clock.tick(1000 * 5 + 1) // extra 1ms
      await callAndExpect(counter, 1, 0)
      await callAndExpect(counter, 1000, 0)

      clock.tick(1000 * 30 + 1) // extra 1ms
      await callAndExpect(counter, 1, 1)
    })
  })
})
