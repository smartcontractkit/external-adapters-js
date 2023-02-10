import FakeTimers, { InstalledClock } from '@sinonjs/fake-timers'
import axios, { AxiosError } from 'axios'
import { AddressInfo } from 'net'
import { AdapterResponse, PartialAdapterResponse } from '@chainlink/external-adapter-framework/util'
import { LocalCache } from '@chainlink/external-adapter-framework/cache'
import { expose } from '@chainlink/external-adapter-framework'
import nock from 'nock'

import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from '../../src/config'
import { priceEndpoint } from '../../src/endpoint'
import includes from '../../src/config/includes.json'

import { IO, mockSSE, mockRESTInstruments, mockRESTPrice } from './fixtures'

const CACHE_MAX_AGE = 4000
const BACKGROUND_EXECUTE_MS_SSE = 1_000

const BACKGROUND_EXECUTE_MS = 1_000
const BUFFER_TIME = 1_000
const CACHE_EXPIRATION_MS = 10_000

const CACHE_SET_MS = 10

const CACHE_MAX_ITEMS = 1_000

const HTTP_OK = 200
const HTTP_GATEWAY_TIMEOUT = 504

process.env['CACHE_POLLING_MAX_RETRIES'] ??= '0' // Disable retries to make the testing flow easier
process.env['API_ACCOUNT_ID'] ??= 'test-acct-id'
process.env['API_KEY'] ??= 'test-api-key'
process.env['SSE_API_KEY'] ??= 'sse-test-api-key'

const adapter = new PriceAdapter({
  name: 'OANDA',
  defaultEndpoint: 'price',
  customSettings,
  endpoints: [priceEndpoint],
  includes,
})

// Borrowed from @chainlink/external-adapter-framework test utils
function assertEqualResponses(
  actual: AdapterResponse,
  expected: Partial<PartialAdapterResponse> & {
    statusCode: number
  },
) {
  expect(typeof actual?.timestamps?.providerDataReceivedUnixMs).toEqual('number')
  expect(
    typeof (
      actual?.timestamps?.providerDataReceivedUnixMs ??
      actual?.timestamps?.providerDataStreamEstablishedUnixMs
    ),
  ).toEqual('number')

  delete (actual as unknown as Record<string, unknown>)['timestamps']

  expect(expected).toEqual(actual)
}

// Borrowed from @chainlink/external-adapter-framework test utils
async function runAllUntilTime(clock: InstalledClock, time: number): Promise<void> {
  const targetTime = clock.now + time
  while (clock.now < targetTime) {
    await clock.nextAsync()
  }
}

// Borrowed from @chainlink/external-adapter-framework test utils
class MockCache extends LocalCache {
  constructor(maxItems: number) {
    super(maxItems)
  }
  private awaitingPromiseResolve?: (value: unknown) => void

  waitForNextSet() {
    // eslint-disable-next-line no-promise-executor-return
    return new Promise((resolve) => (this.awaitingPromiseResolve = resolve))
  }

  override async set(key: string, value: Readonly<unknown>, ttl: number): Promise<void> {
    super.set(key, value, ttl)
    if (this.awaitingPromiseResolve) {
      this.awaitingPromiseResolve(value)
    }
  }
}

describe('Oanda handles SSE connection with multiple correct and incorrect asset pairs', () => {
  let clock, api, address, mockCache
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    clock = FakeTimers.install()

    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0' // Disable retries to make the testing flow easier
    process.env['API_ACCOUNT_ID'] = 'test-acct-id'
    process.env['API_KEY'] = 'test-api-key'
    process.env['SSE_API_KEY'] = 'sse-test-api-key'

    if (!process.env['RECORD']) {
      mockSSE()
      mockRESTInstruments()
      mockRESTPrice()
    } else {
      nock.recorder.rec()
    }

    mockCache = new MockCache(CACHE_MAX_ITEMS)

    api = await expose(adapter, {
      cache: mockCache,
    })

    address = `http://localhost:${(api?.server?.address() as AddressInfo)?.port}`
  })

  afterAll(() => {
    process.env = oldEnv
  })

  for (const { request, response } of IO) {
    it(`Test { base: ${request.data.base}, quote: ${request.data.quote} } request`, async () => {
      const makeRequest = () => axios.post(address, request)

      try {
        ;(await makeRequest()) as unknown as AxiosError | undefined
      } catch (error) {
        expect(error?.response?.status).toEqual(HTTP_GATEWAY_TIMEOUT)
      }

      switch (response.statusCode) {
        case HTTP_OK: {
          // Advance clock so that the batch warmer executes once again and wait for the cache to be set
          const cacheValueSetPromise = mockCache.waitForNextSet()
          await runAllUntilTime(clock, BACKGROUND_EXECUTE_MS_SSE + 10)
          await cacheValueSetPromise

          console.log('HTTP_OK')
          await clock.tickAsync(3000) //TODO was BACKGROUND_EXECUTE_MS

          const res = await makeRequest()

          expect(res.status).toEqual(response.statusCode)
          assertEqualResponses(res.data, response)

          break
        }
        case HTTP_GATEWAY_TIMEOUT: {
          console.log('HTTP_GATEWAY_TIMEOUT')
          await clock.tickAsync(CACHE_EXPIRATION_MS + BACKGROUND_EXECUTE_MS)

          const error = (await makeRequest()) as unknown as AxiosError | undefined

          expect(error?.response?.status).toEqual(HTTP_GATEWAY_TIMEOUT)

          break
        }
        default: {
          throw Error(`No handler for status: ${response.statusCode}`)
        }
      }
      console.log('Accelerate clock')
      await clock.tickAsync(BACKGROUND_EXECUTE_MS + CACHE_SET_MS)
    })
  }
})
