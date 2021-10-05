import { createStore } from 'redux'
import { stub } from 'sinon'
import { withDebug } from '../../../src'
import { defaultOptions, withCache } from '../../../src/lib/cache'
import { logger } from '../../../src/lib/external-adapter'
import * as rateLimit from '../../../src/lib/rate-limit'
import { get } from '../../../src/lib/rate-limit/config'
import { dataProviderMock, getRLTokenSpentPerMinute, setupClock } from './helpers'
import { withMiddleware } from '../../../src/index'
import { AdapterContext } from '@chainlink/types'

describe('Rate Limit/Cache - Integration', () => {
  const context: AdapterContext = {}
  const capacity = 50
  let logWarnStub: any
  let logErrorStub: any

  beforeAll(async () => {
    process.env.RATE_LIMIT_ENABLED = String(true)
    process.env.RATE_LIMIT_CAPACITY = String(capacity)
    process.env.CACHE_ENABLED = String(true)

    // Log is too heavy on this tests
    process.env.DEBUG = String(false)
    process.env.LOG_LEVEL = String(false)
    process.env.NODE_ENV = 'no-debug'

    logWarnStub = stub(logger, 'warn')
    logErrorStub = stub(logger, 'error')

    const options = defaultOptions()
    context.cache = {
      ...defaultOptions(),
      instance: await options.cacheBuilder(options.cacheImplOptions),
    }
    context.rateLimit = get({})
  })

  afterAll(() => {
    logWarnStub.reset()
    logErrorStub.reset()
  })

  it('Composite feeds requests go over capacity on initialization, then stabilize', async () => {
    const [clock, restoreClock] = setupClock()

    const store = createStore(rateLimit.reducer.rootReducer, {})
    const dataProvider = dataProviderMock()
    const executeWithMiddleware = await withMiddleware(dataProvider.execute, context, [
      withCache(),
      rateLimit.withRateLimit(store),
      withDebug,
    ])

    const timeBetweenRequests = 500
    const feedsNumber = 5
    // Requests made in 3 mins
    for (let i = 0; i < (1000 / timeBetweenRequests) * 180; i++) {
      const feedId = i % feedsNumber
      for (let internalReq = 0; internalReq < 10; internalReq++) {
        const input = { id: '6', data: { composite1: feedId, quote: internalReq } }
        await executeWithMiddleware(input, context)
      }
      clock.tick(timeBetweenRequests)
    }

    const state = store.getState()
    const rlPerMinute = getRLTokenSpentPerMinute(state.heartbeats)

    expect(rlPerMinute[0]).toBeGreaterThan(capacity)
    expect(rlPerMinute[1]).toBeLessThan(capacity)
    expect(rlPerMinute[2]).toBeLessThan(capacity)
    restoreClock()
  })
})
