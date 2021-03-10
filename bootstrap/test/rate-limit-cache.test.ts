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

const makeExecuteWithWarmer = async (execute: Execute) => {
  const initState = { cacheWarmer: {}, rateLimit: {} }
  const rootReducer = combineReducers({
    cacheWarmer: cacheWarmer.reducer.rootReducer,
    rateLimit: rateLimit.reducer.rootReducer,
  })
  cacheWarmer.epics.epicMiddleware.run(cacheWarmer.epics.rootEpic)
  const store = configureStore(rootReducer, initState, [cacheWarmer.epics.epicMiddleware])
  const executeWithMiddleware = await withMiddleware(execute, [
    withCache,
    rateLimit.withRateLimit({
      getState: () => store.getState().rateLimit,
      dispatch: (a) => store.dispatch(a),
    } as Store),
  ])
  return async (data: AdapterRequest) => {
    await executeWithMiddleware(data)
    store.dispatch(
      cacheWarmer.actions.warmupSubscribed({
        id: data.id,
        executeFn: executeWithMiddleware,
        data,
      } as cacheWarmer.actions.WarmupSubscribedPayload),
    )
  }
}

const dataProviderMock = (
  cost = 1,
): {
  totalRequestsReceived: () => number[]
  requestsReceived: () => number
  execute: Execute
} => {
  const requestsReceivedPerMin: number[] = []
  let requestsInMin = 0
  let lastMinute = new Date().getMinutes()
  return {
    totalRequestsReceived: () => requestsReceivedPerMin,
    requestsReceived: () => requestsInMin,
    execute: async (request) => {
      const now = new Date().getMinutes()
      if (now !== lastMinute) {
        lastMinute = now
        requestsInMin = 0
      }
      requestsInMin = requestsInMin + 1 * cost
      requestsReceivedPerMin[lastMinute] = requestsInMin
      return {
        jobRunID: request.id,
        data: {
          result: requestsInMin,
          cost,
        },
        result: requestsInMin,
        statusCode: 200,
      }
    },
  }
}

describe('Rate Limit/Cache - Integration', () => {
  const capacity = 50
  before(() => {
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

        expect(dataProvider.requestsReceived()).to.be.lessThan(capacity)
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

      expect(dataProvider.requestsReceived()).to.be.lessThan(capacity)
    })

    it('Multiple feed with high costs go over capacity on initialization, then stabilize', async () => {
      for (let cost = 2; cost < 4; cost++) {
        clock = useFakeTimers()
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

        console.log('WITH COST:', cost, dataProvider.totalRequestsReceived())
        expect(dataProvider.totalRequestsReceived()[0]).to.be.greaterThan(capacity)
        expect(dataProvider.totalRequestsReceived()[1]).to.be.lessThan(capacity)
        clock.restore()
      }
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

      expect(dataProvider.totalRequestsReceived()[0]).to.be.greaterThan(capacity)
      expect(dataProvider.totalRequestsReceived()[1]).to.be.lessThan(capacity)
      expect(dataProvider.totalRequestsReceived()[2]).to.be.lessThan(capacity)
    })

    it('Single Feed with Cache warmer stay under capacity', async () => {
      const dataProvider = dataProviderMock()
      const executeWithWarmer = await makeExecuteWithWarmer(dataProvider.execute)

      const secsInMin = 60
      for (let i = 0; i < secsInMin; i++) {
        const input = { id: '6', data: { warmer1: 1 } }
        await executeWithWarmer(input)
        clock.tick(1000)
      }

      expect(dataProvider.requestsReceived()).to.be.lessThan(capacity)
    })

    it('Composite feeds requests with warmer go over capacity on initialization, then stabilize', async () => {
      const dataProvider = dataProviderMock()
      const executeWithWarmer = await makeExecuteWithWarmer(dataProvider.execute)

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

      expect(dataProvider.totalRequestsReceived()[0]).to.be.greaterThan(capacity)
      expect(dataProvider.totalRequestsReceived()[1]).to.be.lessThan(capacity)
      expect(dataProvider.totalRequestsReceived()[2]).to.be.lessThan(capacity)
    })
  })
})
