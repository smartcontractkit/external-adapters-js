import { createStore } from 'redux'
import { stub, SinonStub } from 'sinon'
import { withDebug } from '../../../src/lib/middleware/debugger'
import { defaultOptions, withCache } from '../../../src/lib/middleware/cache'
import { logger } from '../../../src/lib/modules/logger'
import * as RateLimit from '../../../src/lib/middleware/rate-limit'
import { get } from '../../../src/lib/config/provider-limits/config'
import { dataProviderMock, getRLTokenSpentPerMinute, setupClock } from './helpers'
import { withMiddleware } from '../../../src/index'
import type { AdapterContext } from '../../../src/types'

describe('Rate Limit/Cache - Integration', () => {
  let oldEnv: NodeJS.ProcessEnv
  const context: AdapterContext = {}
  const capacity = 50
  let logWarnStub: SinonStub
  let logErrorStub: SinonStub

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

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
    context.limits = get(undefined, context)
  })

  afterEach(async () => {
    const options = defaultOptions()
    context.cache = {
      ...defaultOptions(),
      instance: await options.cacheBuilder(options.cacheImplOptions),
    }
  })

  afterAll(() => {
    logWarnStub.reset()
    logErrorStub.reset()
    process.env = oldEnv
  })

  it('Burst feeds requests stay under capacity', async () => {
    const [clock, restoreClock] = setupClock()
    const store = createStore(RateLimit.reducer.rootReducer, {})
    const dataProvider = dataProviderMock()
    const executeWithMiddleware = await withMiddleware(dataProvider.execute, context, [
      withCache(),
      RateLimit.withRateLimit(store),
      withDebug(),
    ])

    const timeBetweenRequests = 500
    const feedsNumber = 5
    // Requests made in 3 mins
    for (let i = 0; i < (1000 / timeBetweenRequests) * 180; i++) {
      const feedId = i % feedsNumber
      await Promise.all(
        new Array(10).fill('').map(async (_, internalReq) => {
          const input = {
            id: '6',
            data: { burst1: feedId, quote: internalReq },
            debug: { cacheKey: String(feedId) + '-' + String(internalReq) },
          }
          return await executeWithMiddleware(input, context)
        }),
      )
      clock.tick(timeBetweenRequests)
    }

    const state = store.getState()
    const rlPerMinute = getRLTokenSpentPerMinute(state.heartbeats)
    expect(rlPerMinute[0]).toBeGreaterThan(capacity)
    expect(rlPerMinute[1]).toBeLessThanOrEqual(capacity)
    expect(rlPerMinute[2]).toBeLessThanOrEqual(capacity)
    restoreClock()
  })
})
