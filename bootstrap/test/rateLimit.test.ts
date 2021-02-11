import { expect } from 'chai'
import sinon from 'sinon'
import { defaultOptions } from '../src/lib/cache'
import { makeRateLimit, RateLimitGroup } from '../src/lib/cache/ratelimit'
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
    const sandbox = sinon.createSandbox()
    before(() => {
      process.env.API_KEY = 'some'
      process.env.CACHE_RATE_CAPACITY = '30'
      process.env.CACHE_ENABLED = 'true'
      process.env.CACHE_TYPE = 'redis'

      sandbox.stub(RedisCache, 'build').returns(Promise.resolve({} as RedisCache))
    })

    it(`rate limit is enabled`, async () => {
      const options = defaultOptions()
      const cache = await options.cacheBuilder(options.cacheOptions)
      const rateLimit = makeRateLimit(options.rateLimit, cache)
      console.log(options)
      expect(rateLimit.isEnabled()).to.be.true
    })

    after(() => {
      sandbox.restore()
    })
  })

  context('Rate limit functions', () => {
    let options: any
    const sandbox = sinon.createSandbox()
    const participantId = 'dpi_usd'
    const group: RateLimitGroup = {
      totalCapacity: 30,
      participants: {
        [participantId]: {
          cost: 10,
          weight: 1,
        },
        dpi_eth: {
          cost: 1,
          weight: 1,
        },
      },
    }
    before(() => {
      process.env.API_KEY = 'some'
      process.env.CACHE_RATE_CAPACITY = '30'
      process.env.CACHE_ENABLED = 'true'
      process.env.CACHE_TYPE = 'redis'
      const redis = {
        get: async (key: any) => group,
        setKeepingMaxAge: async (key: string, value: any, maxAge: number) => ({}),
      }
      sandbox.stub(RedisCache, 'build').returns(Promise.resolve(redis as RedisCache))

      options = defaultOptions()
    })

    it(`max age is properly calculated`, async () => {
      options.rateLimit.participantId = participantId
      const cache = await options.cacheBuilder(options.cacheOptions)
      const rateLimit = makeRateLimit(options.rateLimit, cache)
      expect(await rateLimit.getParticipantMaxAge()).to.be.equal(44444)
    })

    it(`group is properly updated`, async () => {
      options.rateLimit.participantId = 'dpi_eur'
      const cache = await options.cacheBuilder(options.cacheOptions)
      const rateLimit = makeRateLimit(options.rateLimit, cache)
      const newParticipant = {
        cost: 30,
        weight: 2,
      }
      const expectedNewGroup = {
        totalCapacity: group.totalCapacity,
        participants: {
          ...group.participants,
          [options.rateLimit.participantId]: newParticipant,
        },
      }
      expect(
        await rateLimit.updateRateLimitGroup(newParticipant.cost, newParticipant.weight),
      ).to.be.deep.equal(expectedNewGroup)
    })

    after(() => {
      sandbox.reset()
    })
  })
})
