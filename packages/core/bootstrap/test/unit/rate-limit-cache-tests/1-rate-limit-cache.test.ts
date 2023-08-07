import { createStore, EmptyObject } from 'redux'
import { stub, SinonStub, SinonFakeTimers, useFakeTimers } from 'sinon'
import { withDebug } from '../../../src/lib/middleware/debugger'
import { defaultOptions, withCache } from '../../../src/lib/middleware/cache'
import { logger } from '../../../src/lib/modules/logger'
import * as rateLimit from '../../../src/lib/middleware/rate-limit'
import { get } from '../../../src/lib/config/provider-limits/config'
import {
  dataProviderMock,
  getRLTokenSpentPerMinute,
  makeExecuteWithWarmer,
  newStore,
} from './helpers'
import { withMiddleware } from '../../../src/index'
import type { AdapterContext } from '../../../src/types'
import { Heartbeats } from '../../../src/lib/middleware/rate-limit/reducer'

describe('Rate Limit/Cache - Integration', () => {
  let oldEnv: NodeJS.ProcessEnv
  const context: AdapterContext = {}
  const capacity = 50
  let logWarnStub: SinonStub
  let logErrorStub: SinonStub
  let clock: SinonFakeTimers

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

  beforeEach(async () => {
    clock = useFakeTimers()
  })

  afterEach(() => {
    clock.restore()
  })

  afterAll(() => {
    logWarnStub.reset()
    logErrorStub.reset()
    process.env = oldEnv
  })

  it('Single feed requests stay under capacity', async () => {
    for (let cost = 1; cost < 4; cost++) {
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const dataProvider = dataProviderMock(cost)
      const executeWithMiddleware = await withMiddleware(dataProvider.execute, context, [
        withCache(),
        rateLimit.withRateLimit(store),
        withDebug(),
      ])
      const secsInMin = 60
      for (let i = 0; i < secsInMin; i++) {
        const input = { id: '6', data: { test1: 1 }, debug: { cacheKey: '5-1' } }
        await executeWithMiddleware(input, context)
        clock.tick(1000)
      }
      const state = store.getState()
      const rlPerMinute = getRLTokenSpentPerMinute(state.heartbeats)
      const minute = cost - 1
      expect(rlPerMinute[minute]).toBeLessThan(capacity)
    }
  })

  it('Multiple feed with no cost requests stay under capacity', async () => {
    const store = createStore(rateLimit.reducer.rootReducer, {})
    const dataProvider = dataProviderMock()
    const executeWithMiddleware = await withMiddleware(dataProvider.execute, context, [
      withCache(),
      rateLimit.withRateLimit(store),
      withDebug(),
    ])

    const timeBetweenRequests = 500
    const feedsNumber = 10
    for (let i = 0; i < (1000 / timeBetweenRequests) * 60; i++) {
      const feedId = i % feedsNumber
      const input = {
        id: '6',
        data: { multiple1: feedId },
        debug: { cacheKey: `4-${String(feedId)}` },
      }
      await executeWithMiddleware(input, context)
      clock.tick(timeBetweenRequests)
    }

    const state = store.getState()
    const rlPerMinute = getRLTokenSpentPerMinute(state.heartbeats)
    expect(rlPerMinute[0]).toBeLessThan(capacity)
  })

  it('Multiple feed with high costs go over capacity on initialization, then stabilize', async () => {
    const cost = 4
    const store = createStore(rateLimit.reducer.rootReducer, {})
    const dataProvider = dataProviderMock(cost)
    const executeWithMiddleware = await withMiddleware(dataProvider.execute, context, [
      withCache(),
      rateLimit.withRateLimit(store),
      withDebug(),
    ])

    const timeBetweenRequests = 500
    const feedsNumber = 10
    for (let i = 0; i < (1000 / timeBetweenRequests) * 120; i++) {
      const feedId = i % feedsNumber
      const input = {
        id: '6',
        data: { [`multiple_cost:${cost}`]: feedId },
        debug: { cacheKey: `1-${String(feedId)}` },
      }
      await executeWithMiddleware(input, context)
      clock.tick(timeBetweenRequests)
    }

    const state = store.getState() as EmptyObject & { heartbeats: Heartbeats }
    const rlPerMinute = getRLTokenSpentPerMinute(state.heartbeats)

    expect(rlPerMinute[0]).toBeGreaterThan(capacity)
    expect(rlPerMinute[1]).toBeLessThanOrEqual(capacity)
  })

  it('Single Feed with Cache warmer stay under capacity', async () => {
    const dataProvider = dataProviderMock()
    const store = newStore()
    const executeWithWarmer = await makeExecuteWithWarmer(dataProvider.execute, store)

    const secsInMin = 60
    for (let i = 0; i < secsInMin; i++) {
      const input = { id: '6', data: { warmer1: 1 }, debug: { cacheKey: '2-1' } }
      await executeWithWarmer(input)
      clock.tick(1000)
    }

    // as EmptyObject & { heartbeats: Heartbeats }
    const state = store.getState() as EmptyObject & { rateLimit: { heartbeats: Heartbeats } }
    const rlPerMinute = getRLTokenSpentPerMinute(state.rateLimit.heartbeats)

    expect(rlPerMinute[0]).toBeLessThan(capacity)
  })

  it('1 h simulation', async () => {
    const dataProvider = dataProviderMock()
    const store = newStore()
    const executeWithWarmer = await makeExecuteWithWarmer(dataProvider.execute, store)

    // 120 Feeds: 3 Composite, rest are single feeds
    const totalFeeds = 120
    const composite = 3
    const feeds = new Array(totalFeeds).fill('').map((_, feedId) => {
      if (feedId % (totalFeeds / composite) === 0) {
        return new Array(10).fill('').map((_, internalReq) => {
          return {
            id: '6',
            data: { singleFeed: feedId, quote: internalReq },
            debug: { cacheKey: String(feedId) },
          }
        })
      }
      return [
        {
          id: '6',
          data: { singleFeed: feedId, quote: 1 },
          debug: { cacheKey: `3-${String(feedId)}` },
        },
      ]
    })

    const _getRandomFeed = () => {
      return feeds[Math.floor(Math.random() * feeds.length)]
    }

    const timeBetweenRequests = 1000
    const hours = 1
    for (let i = 0; i < (1000 / timeBetweenRequests) * hours * 60 * 60; i++) {
      const feed = _getRandomFeed()
      for (let i = 0; i < feed.length; i++) {
        const input = feed[i]
        await executeWithWarmer(input)
      }
      clock.tick(timeBetweenRequests)
    }

    const state = store.getState() as EmptyObject & { rateLimit: { heartbeats: Heartbeats } }
    const rlPerMinute = getRLTokenSpentPerMinute(state.rateLimit.heartbeats)

    Object.values(rlPerMinute).forEach((req) => {
      expect(req).toBeLessThan(capacity + 20)
    })
  })
})
