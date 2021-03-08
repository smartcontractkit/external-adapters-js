import { expect } from 'chai'
import { useFakeTimers } from 'sinon'
import { createStore } from 'redux'
import { Execute } from '@chainlink/types'
import * as rateLimit from '../src/lib/rate-limit'

const counterFrom = (i = 0): Execute => async (request) => {
  const result = i++
  return {
    jobRunID: request.id,
    data: { jobRunID: request.id, statusCode: 200, data: request, result },
    result,
    statusCode: 200,
  }
}

describe('Rate Limit', () => {
  context('Requests Storing', () => {
    let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      clock = useFakeTimers()
    })

    afterEach(() => {
      clock.restore()
    })

    it(`Requests are stored`, async () => {
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const execute = await rateLimit.withRateLimit(store)(counterFrom(0))
      for (let i = 0; i <= 5; i++) {
        await execute({ id: String(i), data: {} })
      }

      const { heartbeats } = store.getState()
      expect(heartbeats.total.DAY.length).to.equal(6)
    })

    it(`Requests are windowed stored`, async () => {
      const store = createStore(rateLimit.reducer.rootReducer, {})
      const execute = await rateLimit.withRateLimit(store)(counterFrom(0))
      for (let i = 0; i <= 5; i++) {
        await execute({ id: String(i), data: {} })
      }

      const { heartbeats } = store.getState()
      expect(heartbeats.total.DAY.length).to.equal(6)
    })
  })
})
