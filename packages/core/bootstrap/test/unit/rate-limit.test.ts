import { AdapterRequest, AdapterContext, Execute } from '@chainlink/types'
import { createStore, Store } from 'redux'
import { useFakeTimers } from 'sinon'
import * as rateLimit from '../../src/lib/rate-limit'
import { Config, get } from '../../src/lib/rate-limit/config'
import {
  IntervalNames,
  Intervals,
  selectParticiantsHeartbeatsFor,
  selectTotalNumberOfHeartbeatsFor,
} from '../../src/lib/rate-limit/reducer'

const counterFrom =
  (i = 0): Execute =>
  async (request) => {
    const result = i++
    return {
      jobRunID: request.id,
      data: { jobRunID: request.id, statusCode: 200, data: request, result },
      result,
      statusCode: 200,
    }
  }

const expectRequestToBe =
  (field: string, expected: any): Execute =>
  async (request) => {
    expect(request[field]).toBe(expected)
    return {
      jobRunID: request.id,
      data: { jobRunID: request.id, statusCode: 200, data: request, result: '' },
      result: '',
      statusCode: 200,
    }
  }

const getMaxAge = (config: Config, store: Store, input: AdapterRequest) => {
  const requestTypeId = rateLimit.makeId(input)
  const state = store.getState()
  const { heartbeats } = state
  const maxThroughput = rateLimit.computeThroughput(
    config,
    heartbeats,
    IntervalNames.HOUR,
    requestTypeId,
  )
  return rateLimit.maxAgeFor(maxThroughput, Intervals[IntervalNames.MINUTE])
}

describe('Rate Limit Middleware', () => {
  const capacity = 50
  const context: AdapterContext = {}
  beforeAll(() => {
    process.env.RATE_LIMIT_ENABLED = String(true)
    process.env.RATE_LIMIT_CAPACITY = String(capacity)
    context.rateLimit = get({})
  })

  describe('Max Age Calculation', () => {
    let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      clock = useFakeTimers()
    })

    afterEach(() => {
      clock.restore()
    })

    it('Max Age is added to the request', async () => {
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const input = { id: '6', data: { base: 1 } }

      const execute = await rateLimit.withRateLimit(store)(
        expectRequestToBe('rateLimitMaxAge', getMaxAge(context.rateLimit, store, input)),
        context,
      )
      await execute(input, context)
    })

    it('Max Age increases on every request', async () => {
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const withRateLimit = rateLimit.withRateLimit(store)

      for (let i = 0; i <= 5; i++) {
        const input = { id: String(i), data: { base: 1 } }
        const execute = await withRateLimit(
          expectRequestToBe('rateLimitMaxAge', getMaxAge(context.rateLimit, store, input)),
          context,
        )
        await execute(input, context)
      }
    })

    it('Max Age is re-calculated on every request based on hearbeats per minute', async () => {
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const withRateLimit = rateLimit.withRateLimit(store)

      for (let i = 1; i <= 5; i++) {
        const input = { id: String(i), data: { base: i } }
        const execute = await withRateLimit(
          expectRequestToBe('rateLimitMaxAge', getMaxAge(context.rateLimit, store, input)),
          context,
        )
        await execute(input, context)
      }

      const input = { id: '1', data: { base: 1 } }
      // After passing the first minute, the max age should be reduced due to expired participants
      clock.tick(Intervals.MINUTE + 1)
      let execute = await withRateLimit(counterFrom(0), {})
      await execute({ id: '1', data: { base: 1 } }, context)

      execute = await withRateLimit(
        expectRequestToBe('rateLimitMaxAge', getMaxAge(context.rateLimit, store, input)),
        context,
      )
      await execute({ id: '1', data: { base: 1 } }, context)
    })

    it('Max Age is lower on recurrent participants', async () => {
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const withRateLimit = rateLimit.withRateLimit(store)
      const uniquePair = 'unique'
      for (let i = 1; i <= 10; i++) {
        const isUnique = i % 2 === 0
        const execute = await withRateLimit(counterFrom(0), context)
        await execute({ id: String(i), data: { base: isUnique ? uniquePair : i } }, {})
      }

      const input = { id: '1', data: { base: 11 } }
      let execute = await withRateLimit(
        expectRequestToBe('rateLimitMaxAge', getMaxAge(context.rateLimit, store, input)),
        context,
      )
      await execute(input, context)

      const input2 = { id: '1', data: { base: uniquePair } }
      execute = await withRateLimit(
        expectRequestToBe('rateLimitMaxAge', getMaxAge(context.rateLimit, store, input2)),
        context,
      )
      await execute(input2, context)
    })
  })

  describe('Request Storing', () => {
    let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      clock = useFakeTimers()
    })

    afterEach(() => {
      clock.restore()
    })

    it(`Total requests are windowed stored`, async () => {
      const intervalName = IntervalNames.HOUR
      const interval = Intervals[intervalName]
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const execute = await rateLimit.withRateLimit(store)(counterFrom(0), context)
      for (let i = 0; i <= 5; i++) {
        await execute({ id: String(i), data: {} }, context)
      }
      let state = store.getState()
      expect(selectTotalNumberOfHeartbeatsFor(state.heartbeats, intervalName)).toBe(7)

      clock.tick(interval - 1)
      await execute({ id: '6', data: {} }, context)
      state = store.getState()
      expect(selectTotalNumberOfHeartbeatsFor(state.heartbeats, intervalName)).toBe(8)

      clock.tick(2)
      await execute({ id: '6', data: {} }, context)
      state = store.getState()
      expect(selectTotalNumberOfHeartbeatsFor(state.heartbeats, intervalName)).toBe(3)
    })

    it(`Participant requests are windowed stored`, async () => {
      const intervalName = IntervalNames.HOUR
      const interval = Intervals[intervalName]
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const execute = await rateLimit.withRateLimit(store)(counterFrom(0), context)
      for (let i = 0; i <= 5; i++) {
        await execute({ id: String(i), data: { base: i } }, context)
      }

      let state = store.getState()
      expect(
        selectParticiantsHeartbeatsFor(
          state.heartbeats,
          intervalName,
          rateLimit.makeId({ id: '1', data: { base: 1 } }),
        ).length,
      ).toBe(1)

      const input = { id: '5', data: { base: 5 } }
      await execute(input, context)
      state = store.getState()
      expect(
        selectParticiantsHeartbeatsFor(state.heartbeats, intervalName, rateLimit.makeId(input))
          .length,
      ).toBe(2)

      // Just before the first sec/minute/hour/day requests should be still stored
      clock.tick(interval - 1)
      await execute(input, context)
      state = store.getState()
      expect(
        selectParticiantsHeartbeatsFor(state.heartbeats, intervalName, rateLimit.makeId(input))
          .length,
      ).toBe(3)

      // Right after the first sec/minute/hour/day, first request should have been expired
      clock.tick(2)
      await execute(input, context)
      state = store.getState()
      expect(
        selectParticiantsHeartbeatsFor(state.heartbeats, intervalName, rateLimit.makeId(input))
          .length,
      ).toBe(2)
    })
  })
})
