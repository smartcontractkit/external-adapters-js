import { expect } from 'chai'
import { useFakeTimers } from 'sinon'
import { createStore, combineReducers, Store } from 'redux'
import { Execute, AdapterRequest } from '@chainlink/types'
import * as rateLimit from '../src/lib/rate-limit'
import { withCache } from '../src/lib/cache'
import * as cacheWarmer from '../src/lib/cache-warmer'
import { configureStore } from '../src/lib/store'

const withMiddleware = async (execute: Execute, middlewares: any[]) => {
  for (let i = 0; i < middlewares.length; i++) {
    execute = await middlewares[i](execute)
  }
  return execute
}

const newStore = () => {
  const initState = { cacheWarmer: {}, rateLimit: {} }
  const rootReducer = combineReducers({
    cacheWarmer: cacheWarmer.reducer.rootReducer,
    rateLimit: rateLimit.reducer.rootReducer,
  })
  cacheWarmer.epics.epicMiddleware.run(cacheWarmer.epics.rootEpic)
  return configureStore(rootReducer, initState, [cacheWarmer.epics.epicMiddleware])
}

const makeExecuteWithWarmer = async (execute: Execute, store: Store) => {
  const executeWithMiddleware = await withMiddleware(execute, [
    withCache,
    rateLimit.withRateLimit({
      getState: () => store.getState().rateLimit,
      dispatch: (a) => store.dispatch(a),
    } as Store),
  ])
  return async (data: AdapterRequest) => {
    const result = await executeWithMiddleware(data)
    store.dispatch(
      cacheWarmer.actions.warmupSubscribed({
        id: data.id,
        executeFn: executeWithMiddleware,
        data,
      } as cacheWarmer.actions.WarmupSubscribedPayload),
    )
    return result
  }
}

const dataProviderMock = (cost = 1): { execute: Execute } => {
  return {
    execute: async (request): Promise<any> => {
      return {
        jobRunID: request.id,
        data: {
          result: '',
          cost,
          rateLimitMaxAge: request.data?.rateLimitMaxAge,
        },
        result: '',
        statusCode: 200,
      }
    },
  }
}

const getRLTokenSpentPerMinute = (hearbeats: rateLimit.reducer.Heartbeats) => {
  const responses = hearbeats.total[rateLimit.reducer.IntervalNames.DAY]
    .filter((r) => !r.isCacheHit)
    .map((r) => ({
      ...r,
      minute: new Date(r.timestamp).getMinutes(),
    }))
  const rlPerMin: { [key: number]: number } = {}
  responses.forEach((r) => {
    if (rlPerMin[r.minute]) {
      rlPerMin[r.minute] += 1 * r.cost
    } else {
      rlPerMin[r.minute] = 1 * r.cost
    }
  })
  return rlPerMin
}

describe('Rate Limit/Cache - Integration', () => {
  const capacity = 50

  before(() => {
    process.env.DEBUG = String(false)
    process.env.LOG_LEVEL = String(false)
    process.env.NODE_ENV = 'no-debug'

    process.env.EXPERIMENTAL_RATE_LIMIT_ENABLED = String(true)
    process.env.RATE_LIMIT_CAPACITY = String(capacity)
    process.env.CACHE_ENABLED = String(true)
  })

  context('', () => {
    let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      clock = useFakeTimers()
    })

    afterEach(() => {
      clock.restore()
    })

    it('Single feed requests stay under capacity', async () => {
      for (let cost = 1; cost < 4; cost++) {
        const store = createStore(rateLimit.reducer.rootReducer, {})
        const dataProvider = dataProviderMock(cost)
        const executeWithMiddleware = await withMiddleware(dataProvider.execute, [
          withCache,
          rateLimit.withRateLimit(store),
        ])

        const secsInMin = 60
        for (let i = 0; i < secsInMin; i++) {
          const input = { id: '6', data: { test1: 1 } }
          await executeWithMiddleware(input)
          clock.tick(1000)
        }

        const state = store.getState()
        const rlPerMinute = getRLTokenSpentPerMinute(state.heartbeats)
        const minute = cost - 1
        expect(rlPerMinute[minute]).to.be.lessThan(capacity)
      }
      clock.restore()
    })

    it('Multiple feed with no cost requests stay under capacity', async () => {
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const dataProvider = dataProviderMock()
      const executeWithMiddleware = await withMiddleware(dataProvider.execute, [
        withCache,
        rateLimit.withRateLimit(store),
      ])

      const timeBetweenRequests = 500
      const feedsNumber = 10
      for (let i = 0; i < (1000 / timeBetweenRequests) * 60; i++) {
        const feedId = i % feedsNumber
        const input = { id: '6', data: { multiple1: feedId } }
        await executeWithMiddleware(input)
        clock.tick(timeBetweenRequests)
      }

      const state = store.getState()
      const rlPerMinute = getRLTokenSpentPerMinute(state.heartbeats)

      expect(rlPerMinute[0]).to.be.lessThan(capacity)
    })

    it('Multiple feed with high costs go over capacity on initialization, then stabilize', async () => {
      const cost = 2
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const dataProvider = dataProviderMock(cost)
      const executeWithMiddleware = await withMiddleware(dataProvider.execute, [
        withCache,
        rateLimit.withRateLimit(store),
      ])

      const timeBetweenRequests = 500
      const feedsNumber = 10
      for (let i = 0; i < (1000 / timeBetweenRequests) * 120; i++) {
        const feedId = i % feedsNumber
        const input = { id: '6', data: { [`multiple_cost:${cost}`]: feedId } }
        await executeWithMiddleware(input)
        clock.tick(timeBetweenRequests)
      }

      const state = store.getState()
      const rlPerMinute = getRLTokenSpentPerMinute(state.heartbeats)

      expect(rlPerMinute[0]).to.be.greaterThan(capacity)
      expect(rlPerMinute[1]).to.be.lte(capacity)
    })

    it('Composite feeds requests go over capacity on initialization, then stabilize', async () => {
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const dataProvider = dataProviderMock()
      const executeWithMiddleware = await withMiddleware(dataProvider.execute, [
        withCache,
        rateLimit.withRateLimit(store),
      ])

      const timeBetweenRequests = 500
      const feedsNumber = 5
      // Requests made in 3 mins
      for (let i = 0; i < (1000 / timeBetweenRequests) * 180; i++) {
        const feedId = i % feedsNumber
        for (let internalReq = 0; internalReq < 10; internalReq++) {
          const input = { id: '6', data: { composite1: feedId, quote: internalReq } }
          await executeWithMiddleware(input)
        }
        clock.tick(timeBetweenRequests)
      }

      const state = store.getState()
      const rlPerMinute = getRLTokenSpentPerMinute(state.heartbeats)

      expect(rlPerMinute[0]).to.be.greaterThan(capacity)
      expect(rlPerMinute[1]).to.be.lessThan(capacity)
      expect(rlPerMinute[2]).to.be.lessThan(capacity)
    })

    it('Single Feed with Cache warmer stay under capacity', async () => {
      const dataProvider = dataProviderMock()
      const store = newStore()
      const executeWithWarmer = await makeExecuteWithWarmer(dataProvider.execute, store)

      const secsInMin = 60
      for (let i = 0; i < secsInMin; i++) {
        const input = { id: '6', data: { warmer1: 1 } }
        await executeWithWarmer(input)
        clock.tick(1000)
      }

      const state = store.getState()
      const rlPerMinute = getRLTokenSpentPerMinute(state.rateLimit.heartbeats)

      expect(rlPerMinute[0]).to.be.lessThan(capacity)
    })

    it('Composite feeds requests with warmer go over capacity on initialization, then stabilize', async () => {
      const dataProvider = dataProviderMock()
      const store = newStore()
      const executeWithWarmer = await makeExecuteWithWarmer(dataProvider.execute, store)

      const timeBetweenRequests = 500
      const feedsNumber = 5
      // Requests made in 3 mins
      for (let i = 0; i < (1000 / timeBetweenRequests) * 180; i++) {
        const feedId = i % feedsNumber
        for (let internalReq = 0; internalReq < 10; internalReq++) {
          const input = { id: '6', data: { warmerComposite1: feedId, quote: internalReq } }
          await executeWithWarmer(input)
        }
        clock.tick(timeBetweenRequests)
      }

      const state = store.getState()
      const rlPerMinute = getRLTokenSpentPerMinute(state.rateLimit.heartbeats)

      expect(rlPerMinute[0]).to.be.greaterThan(capacity)
      expect(rlPerMinute[1]).to.be.lessThan(capacity)
      expect(rlPerMinute[2]).to.be.lessThan(capacity)
    })

    it('Burst feeds requests stay under capacity', async () => {
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const dataProvider = dataProviderMock()
      const executeWithMiddleware = await withMiddleware(dataProvider.execute, [
        withCache,
        rateLimit.withRateLimit(store),
      ])

      const timeBetweenRequests = 500
      const feedsNumber = 5
      // Requests made in 3 mins
      for (let i = 0; i < (1000 / timeBetweenRequests) * 180; i++) {
        const feedId = i % feedsNumber
        await Promise.all(
          new Array(10).fill('').map(async (_, internalReq) => {
            const input = { id: '6', data: { burst1: feedId, quote: internalReq } }
            return await executeWithMiddleware(input)
          }),
        )
        clock.tick(timeBetweenRequests)
      }

      const state = store.getState()
      const rlPerMinute = getRLTokenSpentPerMinute(state.heartbeats)

      expect(rlPerMinute[0]).to.be.greaterThan(capacity)
      expect(rlPerMinute[1]).to.be.lte(capacity)
      expect(rlPerMinute[2]).to.be.lte(capacity)
    })

    // it('1 h simulation', async () => {
    //   const dataProvider = dataProviderMock()
    //   const store = newStore()
    //   const executeWithWarmer = await makeExecuteWithWarmer(dataProvider.execute, store)

    //   // 120 Feeds: 3 Composite, rest are single feeds
    //   const totalFeeds = 120
    //   const composite = 3
    //   const feeds: AdapterRequest[][] = new Array(totalFeeds).fill('').map((_, feedId) => {
    //     if (feedId % (totalFeeds / composite) === 0) {
    //       return new Array(10).fill('').map((_, internalReq) => {
    //         return { id: '6', data: { singleFeed: feedId, quote: internalReq } }
    //       })
    //     }
    //     return [{ id: '6', data: { singleFeed: feedId, quote: 1 } }]
    //   })

    //   const _getRandomFeed = () => {
    //     return feeds[Math.floor(Math.random() * feeds.length)]
    //   }

    //   const timeBetweenRequests = 1000
    //   const hours = 1
    //   for (let i = 0; i < (1000 / timeBetweenRequests) * hours * 60 * 60; i++) {
    //     const feed = _getRandomFeed()
    //     for (let i = 0; i < feed.length; i++) {
    //       const input = feed[i]
    //       await executeWithWarmer(input)
    //     }
    //     clock.tick(timeBetweenRequests)
    //   }

    //   const state = store.getState()
    //   const rlPerMinute = getRLTokenSpentPerMinute(state.rateLimit.heartbeats)

    // Object.values(rlPerMinute).forEach((req) => {
    //   expect(req).to.be.lte(capacity + 10)
    // })
    // })
  })
})
