import { expect } from 'chai'
import { useFakeTimers } from 'sinon'
import { createStore } from 'redux'
import { Execute } from '@chainlink/types'
import * as rateLimit from '../src/lib/rate-limit'
import { withCache } from '../src/lib/cache'

const withMiddleware = async (execute: Execute, middlewares: any[]) => {
  for (let i = 0; i < middlewares.length; i++) {
    execute = await middlewares[i](execute)
  }
  return execute
}

const dataProviderMock = (): {
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
      requestsInMin++
      requestsReceivedPerMin[lastMinute] = requestsInMin
      return {
        jobRunID: request.id,
        data: {
          jobRunID: request.id,
          statusCode: 200,
          data: request,
          result: requestsInMin,
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
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const dataProvider = dataProviderMock()
      const executeWithMiddleware = await withMiddleware(dataProvider.execute, [
        withCache,
        rateLimit.withRateLimit(store),
      ])

      const secsInMin = 60
      for (let i = 0; i < secsInMin; i++) {
        const input = { id: '6', data: { base: 1 } }
        await executeWithMiddleware(input)
        clock.tick(1000)
      }

      expect(dataProvider.requestsReceived()).to.be.lessThan(capacity)
    })

    it('Multiple feed requests stay under capacity', async () => {
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
        const input = { id: '6', data: { base: feedId } }
        await executeWithMiddleware(input)
        clock.tick(timeBetweenRequests)
      }

      expect(dataProvider.requestsReceived()).to.be.lessThan(capacity)
    })

    it('Composite feeds requests initialization go over capacity', async () => {
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const dataProvider = dataProviderMock()
      const executeWithMiddleware = await withMiddleware(dataProvider.execute, [
        withCache,
        rateLimit.withRateLimit(store),
      ])

      const timeBetweenRequests = 500
      const feedsNumber = 5
      for (let i = 0; i < (1000 / timeBetweenRequests) * 60; i++) {
        const feedId = i % feedsNumber
        for (let internalReq = 0; internalReq < 10; internalReq++) {
          const input = { id: '6', data: { base: feedId, quote: internalReq } }
          await executeWithMiddleware(input)
        }
        clock.tick(timeBetweenRequests)
      }

      expect(dataProvider.requestsReceived()).to.be.greaterThan(capacity)
    })

    it('Composite feeds requests stay under capacity after initialization', async () => {
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
          const input = { id: '6', data: { base: feedId, quote: internalReq } }
          await executeWithMiddleware(input)
        }
        clock.tick(timeBetweenRequests)
      }

      expect(dataProvider.totalRequestsReceived()[2]).to.be.lessThan(capacity)
    })
  })
})
