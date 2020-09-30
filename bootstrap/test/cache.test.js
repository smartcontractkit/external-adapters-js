const { expect } = require('chai')
const { useFakeTimers } = require('sinon')
const { withCache, envOptions } = require('../lib/cache')

const callAndExpect = async (fn, n, result) => {
  while (n--) {
    const { data } = await fn(0)
    if (n === 0) expect(data).to.equal(result)
  }
}

// Helper test function: a stateful counter
const counterFrom = (i = 0) => (_, callback) => callback(200, i++)

describe('cache', () => {
  context('options defaults', () => {
    context('ENV disabled', () => {
      beforeEach(() => {
        delete process.env.CACHE_ENABLED
      })

      it(`configures env options with cache enabled: false`, () => {
        const options = envOptions()
        expect(options).to.have.property('enabled', false)
      })
    })

    context('ENV enabled', () => {
      beforeEach(() => {
        process.env.CACHE_ENABLED = 'true'
      })

      it(`configures env options with cache enabled: true`, () => {
        const options = envOptions()
        expect(options).to.have.property('enabled', true)
      })

      it(`configures env options with default maxAge: 1000 * 30`, () => {
        const options = envOptions()
        expect(options.local).to.have.property('maxAge', 1000 * 30)
      })
    })
  })

  context('disabled', () => {
    beforeEach(() => {
      delete process.env.CACHE_ENABLED
    })

    it(`does not cache`, async () => {
      const counter = withCache(counterFrom(1))
      await callAndExpect(counter, 3, 3)
      await callAndExpect(counter, 3, 6)
      await callAndExpect(counter, 3, 9)
      await callAndExpect(counter, 3, 12)
    })
  })

  context('enabled', () => {
    let clock
    beforeEach(() => {
      process.env.CACHE_ENABLED = 'true'
      clock = useFakeTimers()
    })

    afterEach(() => {
      clock.restore()
    })

    it(`caches fn result`, async () => {
      const counter = withCache(counterFrom(0))
      await callAndExpect(counter, 3, 0)
    })

    it(`caches fn result - while entry still young  (under 30s default)`, async () => {
      const counter = withCache(counterFrom(0))
      await callAndExpect(counter, 3, 0)
      await callAndExpect(counter, 3, 0)

      clock.tick(1000)
      await callAndExpect(counter, 3, 0)
      await callAndExpect(counter, 3, 0)

      clock.tick(1000 * 5)
      await callAndExpect(counter, 3, 0)
      await callAndExpect(counter, 3, 0)
    })

    it(`invalidates cache - after default configured maxAge of 30s`, async () => {
      const counter = withCache(counterFrom(0))
      await callAndExpect(counter, 3, 0)

      clock.tick(1000 * 25)
      await callAndExpect(counter, 1, 0)

      clock.tick(1000 * 5 + 1) // extra 1ms
      await callAndExpect(counter, 1, 1)
      await callAndExpect(counter, 1000, 1)

      clock.tick(1000 * 30 + 1) // extra 1ms
      await callAndExpect(counter, 1, 2)
    })

    it(`invalidates cache - after configured maxAge of 10s`, async () => {
      const options = envOptions()
      options.local.maxAge = 1000 * 10

      const counter = withCache(counterFrom(0), options)
      await callAndExpect(counter, 3, 0)

      clock.tick(1000 * 5)
      await callAndExpect(counter, 1, 0)

      clock.tick(1000 * 5 + 1) // extra 1ms
      await callAndExpect(counter, 1, 1)
      await callAndExpect(counter, 1000, 1)

      clock.tick(1000 * 10 + 1) // extra 1ms
      await callAndExpect(counter, 1, 2)
    })
  })
})
