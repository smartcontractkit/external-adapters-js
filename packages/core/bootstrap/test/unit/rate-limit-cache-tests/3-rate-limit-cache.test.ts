import { EmptyObject } from 'redux'
import { stub, SinonStub } from 'sinon'
import { Heartbeats } from '../../../src/lib/middleware/rate-limit/reducer'
import { logger } from '../../../src/lib/modules/logger'
import {
  dataProviderMock,
  getRLTokenSpentPerMinute,
  makeExecuteWithWarmer,
  newStore,
  setupClock,
} from './helpers'

describe('Rate Limit/Cache - Integration', () => {
  let oldEnv: NodeJS.ProcessEnv

  const capacity = 50
  let logWarnStub: SinonStub
  let logErrorStub: SinonStub

  beforeAll(() => {
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
  })

  afterAll(() => {
    logWarnStub.reset()
    logErrorStub.reset()
    process.env = oldEnv
  })

  it('Composite feeds requests with warmer go over capacity on initialization, then stabilize', async () => {
    const [clock, restoreClock] = setupClock()
    const dataProvider = dataProviderMock()
    const store = newStore()
    const executeWithWarmer = await makeExecuteWithWarmer(dataProvider.execute, store)

    const timeBetweenRequests = 500
    const feedsNumber = 5
    // Requests made in 3 mins
    for (let i = 0; i < (1000 / timeBetweenRequests) * 180; i++) {
      const feedId = i % feedsNumber
      for (let internalReq = 0; internalReq < 10; internalReq++) {
        const input = {
          id: '6',
          data: { warmerComposite1: feedId, quote: internalReq },
          debug: { cacheKey: String(feedId) + '-' + String(internalReq) },
        }
        await executeWithWarmer(input)
      }
      clock.tick(timeBetweenRequests)
    }

    const state = store.getState() as EmptyObject & { rateLimit: { heartbeats: Heartbeats } }
    const rlPerMinute = getRLTokenSpentPerMinute(state.rateLimit.heartbeats)

    expect(rlPerMinute[0]).toBeGreaterThan(capacity)
    expect(rlPerMinute[1]).toBeLessThan(capacity)
    expect(rlPerMinute[2]).toBeLessThan(capacity)
    restoreClock()
  })
})
