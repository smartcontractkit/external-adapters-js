import { expect } from 'chai'
import sinon from 'sinon'
import { defaultOptions } from '../src/lib/cache'
import { makeRateLimit } from '../src/lib/cache/ratelimit'
import { RedisCache } from '../src/lib/cache/redis'

describe('rate limit', () => {
  context('Disabled', () => {
    before(() => {
      delete process.env.API_KEY
      delete process.env.CACHE_RATE_CAPACITY
    })

    it(`rate limit is disabled without env rate limit`, async () => {
      const options = defaultOptions()
      const cache = await options.cacheBuilder(options.cacheOptions)
      const rateLimit = makeRateLimit(options.rateLimit, cache)
      expect(rateLimit.isEnabled()).to.be.false
    })

    before(() => {
      process.env.API_KEY = 'some'
      process.env.CACHE_RATE_CAPACITY = '30'
      process.env.CACHE_ENABLED = 'true'
      process.env.CACHE_TYPE = 'local'
    })

    it(`rate limit is disabled with local cache`, async () => {
      const options = defaultOptions()
      const cache = await options.cacheBuilder(options.cacheOptions)
      const rateLimit = makeRateLimit(options.rateLimit, cache)
      expect(rateLimit.isEnabled()).to.be.false
    })
  })

  context('Enabled', () => {
    before(() => {
      process.env.API_KEY = 'some'
      process.env.CACHE_RATE_CAPACITY = '30'
      process.env.CACHE_ENABLED = 'true'
      process.env.CACHE_TYPE = 'redis'

      sinon.stub(RedisCache, 'build').returns(Promise.resolve({} as RedisCache))
    })

    it(`rate limit is enabled`, async () => {
      const options = defaultOptions()
      const cache = await options.cacheBuilder(options.cacheOptions)
      const rateLimit = makeRateLimit(options.rateLimit, cache)
      console.log(options)
      expect(rateLimit.isEnabled()).to.be.true
    })
  })
})
