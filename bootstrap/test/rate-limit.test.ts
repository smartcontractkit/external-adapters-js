import { expect } from 'chai'
import { useFakeTimers } from 'sinon'
import { createStore } from 'redux'
import { Execute } from '@chainlink/types'
import * as rateLimit from '../src/lib/rate-limit'
import { IntervalNames, Intervals, selectObserved } from '../src/lib/rate-limit/reducer'

const counterFrom = (i = 0): Execute => async (request) => {
  const result = i++
  return {
    jobRunID: request.id,
    data: { jobRunID: request.id, statusCode: 200, data: request, result },
    result,
    statusCode: 200,
  }
}

const expectRequestToBe = (field: string, expected: any): Execute => async (request) => {
  expect(request.data[field]).to.equal(expected)
  return {
    jobRunID: request.id,
    data: { jobRunID: request.id, statusCode: 200, data: request, result: '' },
    result: '',
    statusCode: 200,
  }
}

const expectRequestToLessThan = (field: string, expected: any): Execute => async (request) => {
  expect(request.data[field]).to.be.lessThan(expected)
  return {
    jobRunID: request.id,
    data: { jobRunID: request.id, statusCode: 200, data: request, result: '' },
    result: '',
    statusCode: 200,
  }
}

describe('Rate Limit Middleware', () => {
  const capacity = 50
  before(() => {
    process.env.RATE_LIMIT_CAPACITY = String(capacity)
  })

  context('Max Age Calculation', () => {
    let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      clock = useFakeTimers()
    })

    afterEach(() => {
      clock.restore()
    })

    it('Max Age is added to the request', async () => {
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const execute = await rateLimit.withRateLimit(store)(expectRequestToBe('maxAge', 1333))
      const input = { id: '6', data: { base: 1 } }
      await execute(input)
    })

    it('Max Age keeps the same for same requests', async () => {
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const withRateLimit = rateLimit.withRateLimit(store)

      const execute = await withRateLimit(expectRequestToBe('maxAge', 1333))
      for (let i = 0; i <= 5; i++) {
        await execute({ id: String(i), data: { base: 1 } })
      }
    })

    it('Max Age is re-calculated on every request based on hearbeats per minute', async () => {
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const withRateLimit = rateLimit.withRateLimit(store)

      for (let i = 1; i <= 5; i++) {
        const weight = 1 / i
        const max = 0.9 * capacity * weight
        const expectedMaxAge = Math.floor(Intervals.MINUTE / max)
        const execute = await withRateLimit(expectRequestToBe('maxAge', expectedMaxAge))
        await execute({ id: String(i), data: { base: i } })
      }

      // After passing the first minute, the max age should be reduced due to expired participants
      clock.tick(Intervals.MINUTE + 1)
      let execute = await withRateLimit(counterFrom(0))
      await execute({ id: '1', data: { base: 1 } })

      execute = await withRateLimit(expectRequestToBe('maxAge', 1333))
      await execute({ id: '1', data: { base: 1 } })
    })

    it('Max Age is lower on recurrent participants', async () => {
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const withRateLimit = rateLimit.withRateLimit(store)
      const uniquePair = 'unique'
      for (let i = 1; i <= 10; i++) {
        const isUnique = i % 2 === 0
        const execute = await withRateLimit(counterFrom(0))
        await execute({ id: String(i), data: { base: isUnique ? uniquePair : i } })
      }

      const weight = 1 / 11
      const max = 0.9 * capacity * weight
      const singleParticipantsMaxAge = Math.floor(Intervals.MINUTE / max)

      let execute = await withRateLimit(expectRequestToBe('maxAge', singleParticipantsMaxAge))
      await execute({ id: '1', data: { base: 11 } })

      execute = await withRateLimit(expectRequestToLessThan('maxAge', singleParticipantsMaxAge))
      await execute({ id: '1', data: { base: uniquePair } })
    })
  })

  context('Request Storing', () => {
    let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      clock = useFakeTimers()
    })

    afterEach(() => {
      clock.restore()
    })

    it(`Total requests are windowed stored`, async () => {
      for (const [intervalName, interval] of Object.entries(Intervals)) {
        const store = createStore(rateLimit.reducer.rootReducer, {})
        const execute = await rateLimit.withRateLimit(store)(counterFrom(0))
        for (let i = 0; i <= 5; i++) {
          await execute({ id: String(i), data: {} })
        }
        let state = store.getState()
        expect(selectObserved(state.heartbeats, intervalName as IntervalNames).length).to.equal(6)

        clock.tick(interval - 1)
        await execute({ id: '6', data: {} })
        state = store.getState()
        expect(selectObserved(state.heartbeats, intervalName as IntervalNames).length).to.equal(7)

        clock.tick(2)
        await execute({ id: '6', data: {} })
        state = store.getState()
        expect(selectObserved(state.heartbeats, intervalName as IntervalNames).length).to.equal(2)
      }
    })

    it(`Participant requests are windowed stored`, async () => {
      for (const [intervalName, interval] of Object.entries(Intervals)) {
        const store = createStore(rateLimit.reducer.rootReducer, {})
        const execute = await rateLimit.withRateLimit(store)(counterFrom(0))
        for (let i = 0; i <= 5; i++) {
          await execute({ id: String(i), data: { base: i } })
        }

        let state = store.getState()
        expect(
          selectObserved(
            state.heartbeats,
            intervalName as IntervalNames,
            rateLimit.makeId({ id: '1', data: { base: 1 } }),
          ).length,
        ).to.equal(1)

        const input = { id: '5', data: { base: 5 } }
        await execute(input)
        state = store.getState()
        expect(
          selectObserved(state.heartbeats, intervalName as IntervalNames, rateLimit.makeId(input))
            .length,
        ).to.equal(2)

        // Just before the first sec/minute/hour/day requests should be still stored
        clock.tick(interval - 1)
        await execute(input)
        state = store.getState()
        expect(
          selectObserved(state.heartbeats, intervalName as IntervalNames, rateLimit.makeId(input))
            .length,
        ).to.equal(3)

        // Right after the first sec/minute/hour/day, first request should have been expired
        clock.tick(2)
        await execute(input)
        state = store.getState()
        expect(
          selectObserved(state.heartbeats, intervalName as IntervalNames, rateLimit.makeId(input))
            .length,
        ).to.equal(2)
      }
    })
  })
})
