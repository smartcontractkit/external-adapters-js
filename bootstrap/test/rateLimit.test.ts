import { expect } from 'chai'
import { defaultOptions } from '../src/lib/cache'
import { makeRateLimit, RateLimit } from '../src/lib/cache/rateLimit'

describe('rate limit', () => {
  context('Disabled', () => {
    before(() => {
      delete process.env.API_KEY
      delete process.env.RATE_LIMIT_CAPACITY
    })

    it(`rate limit is disabled without env rate limit`, () => {
      const options = defaultOptions()
      const rateLimit = makeRateLimit(options.rateLimit)
      expect(rateLimit.isEnabled()).to.be.false
    })

    before(() => {
      process.env.API_KEY = 'some'
    })

    it(`rate limit is disabled without rate limit capacity`, () => {
      const options = defaultOptions()
      const rateLimit = makeRateLimit(options.rateLimit)
      expect(rateLimit.isEnabled()).to.be.false
    })
  })

  context('Enabled', () => {
    before(() => {
      process.env.API_KEY = 'some'
      process.env.RATE_LIMIT_CAPACITY = '30'
      process.env.CACHE_ENABLED = 'true'
      process.env.CACHE_TYPE = 'redis'
    })

    it(`rate limit is enabled`, () => {
      const options = defaultOptions()
      const rateLimit = makeRateLimit(options.rateLimit)
      expect(rateLimit.isEnabled()).to.be.true
    })
  })

  context('Rate limit Max Age', () => {
    let options: any
    let rateLimit: RateLimit
    const firstParticipant = 'dpi_usd'

    before(() => {
      process.env.API_KEY = 'some'
      process.env.RATE_LIMIT_CAPACITY = '30'
      process.env.CACHE_ENABLED = 'true'
      process.env.CACHE_TYPE = 'redis'

      options = defaultOptions()
      rateLimit = makeRateLimit(options.rateLimit)

      rateLimit.incrementParticipantHeartbeat(firstParticipant)
    })

    it(`max age defaults to a minimum of 30000 `, () => {
      expect(rateLimit.getParticipantMaxAge(firstParticipant)).to.be.equal(30000)
    })

    context('Max Age Participants', () => {
      before(() => {
        const totalAdapters = 30
        for (let i = 0; i < totalAdapters; i++) {
          rateLimit.incrementParticipantHeartbeat(String(i))
        }
      })

      it(`max age is calculated based on participants`, () => {
        expect(rateLimit.getParticipantMaxAge(firstParticipant)).to.be.equal(68889)
      })

      it(`participant heartbeat is increased`, () => {
        for (let i = 0; i < 5; i++) rateLimit.incrementParticipantHeartbeat(firstParticipant)
        expect(rateLimit.incrementParticipantHeartbeat(firstParticipant)).to.be.equal(7)
      })
    })
  })

  context('Participant Expiration', () => {
    const expirationTime = 1000 * 5
    let options: any
    let rateLimit: RateLimit
    const firstParticipant = 'dpi_usd'

    before(() => {
      process.env.API_KEY = 'some'
      process.env.RATE_LIMIT_CAPACITY = '30'
      process.env.CACHE_ENABLED = 'true'
      process.env.CACHE_TYPE = 'redis'
      process.env.GROUP_MAX_AGE = String(expirationTime)

      options = defaultOptions()
      rateLimit = makeRateLimit(options.rateLimit)
    })

    it(`heartbeat expires`, () => {
      setTimeout(() => {
        expect(rateLimit.incrementParticipantHeartbeat(firstParticipant)).to.be.equal(1)
      }, expirationTime + 1000)
    })
  })
})
