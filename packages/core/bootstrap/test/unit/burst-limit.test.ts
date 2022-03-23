import { AdapterContext, APIEndpoint, Execute } from '@chainlink/types'
import { createStore } from 'redux'
import { useFakeTimers, SinonFakeTimers } from 'sinon'
import { reducer as burstLimitReducer, withBurstLimit } from '../../src/lib/middleware/burst-limit'

describe('burst limit', () => {
  let clock: SinonFakeTimers

  beforeEach(() => {
    clock = useFakeTimers()
  })

  afterEach(() => {
    clock.restore()
  })

  it('successfully blocks burst of requests', async () => {
    const execute: Execute = async () => {
      return {
        jobRunID: '1',
        statusCode: 200,
        data: { result: 1 },
        result: 1,
      }
    }

    const request = {
      id: '1',
      data: {
        endpoint: 'testDownstreamEndpoint',
        source: 'SOMESOURCEADAPTER',
      },
    }

    const context: AdapterContext = {
      rateLimit: {
        enabled: true,
        burstCapacity1s: 5,
      },
    }

    const store = createStore(burstLimitReducer.rootReducer, {})
    const middleware = await withBurstLimit(store)(execute, context)

    // Perform initial requests; these should pass
    for (let i = 0; i < 6; i++) {
      await middleware(request, {})
    }
    // This next one will fail on the burst limiter.
    // Wrapped in a custom promise to check state synchronously.
    let burstLimitedRequestResolved = false
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise(async (resolve) => {
      const result = await middleware(request, {})
      burstLimitedRequestResolved = true
      resolve(result)
    })

    // Advance the clock 2s. It will still be retrying, because the total requests are only updated
    // when the reducer is fired by a successful request.
    clock.tickAsync(2000)
    expect(burstLimitedRequestResolved).toBe(false)

    // We can make another request, which should pass.
    await middleware(request, {})

    // Now the redux store should have been updated, and our promise resolved.
    const result = await promise

    // NOTE - Doesn't work, because reducer is only triggered on successful request.
    expect(result).toBeNull()
  }, 10000)
})
