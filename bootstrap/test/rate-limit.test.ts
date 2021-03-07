import { Execute } from '@chainlink/types'
import { expect } from 'chai'
import { useFakeTimers } from 'sinon'
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
      const execute = await rateLimit.withRateLimit(counterFrom(0))
      for (let i = 0; i <= 5; i++) {
        await execute({ id: String(i), data: {} })
      }

      const { heartbeats } = rateLimit.store.getState()
      expect(heartbeats.total.DAY.length).to.equal(6)
    })

    it(`Requests are windowed stored`, async () => {
      const execute = await rateLimit.withRateLimit(counterFrom(0))
      for (let i = 0; i <= 5; i++) {
        await execute({ id: String(i), data: {} })
      }

      const { heartbeats } = rateLimit.store.getState()
      expect(heartbeats.total.DAY.length).to.equal(12)
    })
  })
})
