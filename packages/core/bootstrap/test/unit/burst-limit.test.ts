import { AdapterContext, Execute } from '@chainlink/types'
import { createStore } from 'redux'
import { useFakeTimers, SinonFakeTimers } from 'sinon'
import {
  reducer as burstLimitReducer,
  SECOND_LIMIT_RETRIES,
  withBurstLimit,
} from '../../src/lib/middleware/burst-limit'

describe('burst limit', () => {
  let clock: SinonFakeTimers

  beforeEach(() => {
    clock = useFakeTimers()
  })

  afterEach(() => {
    clock.restore()
  })

  it('successfully delays burst of request per second', async () => {
    const mockResponse = { data: { result: 1 }, jobRunID: '1', result: 1, statusCode: 200 }
    const execute: Execute = async () => {
      return mockResponse
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
      const result = await middleware(request, {})
      expect(result).toBe(mockResponse)
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
    expect(result).toBe(mockResponse)
  }, 10000)

  it('successfully blocks burst of request per minute', async () => {
    const burstCapacity = 5
    const mockResponse = { data: { result: 1 }, jobRunID: '1', result: 1, statusCode: 200 }
    const execute: Execute = async () => {
      return mockResponse
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
        burstCapacity1m: burstCapacity,
      },
    }

    const store = createStore(burstLimitReducer.rootReducer, {})
    const middleware = await withBurstLimit(store)(execute, context)

    // Perform initial requests; these should pass
    for (let i = 0; i < burstCapacity; i++) {
      await middleware(request, {})
      clock.tickAsync(2000)
    }
    // This next one will fail on the burst limiter.
    expect(middleware(request, {})).rejects.toThrow()
  })
})
