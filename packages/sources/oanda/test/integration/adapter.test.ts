import FakeTimers from '@sinonjs/fake-timers'
import axios, { AxiosError } from 'axios'
import { AddressInfo } from 'net'
import { expose } from '@chainlink/external-adapter-framework'
import { AdapterResponse, PartialAdapterResponse } from '@chainlink/external-adapter-framework/util'

import { adapter } from '../../src'

import { IO, mockSSE, mockRESTInstruments, mockRESTPrice } from './fixtures'

const BACKGROUND_EXECUTE_MS = 1_000
const CACHE_EXPIRATION_MS = 10_000

const CACHE_SET_MS = 10

export const HTTP_OK = 200
export const HTTP_GATEWAY_TIMEOUT = 504

process.env['CACHE_POLLING_MAX_RETRIES'] ??= '0' // Disable retries to make the testing flow easier
process.env['API_ACCOUNT_ID'] ??= 'test-acct-id'
process.env['API_KEY'] ??= 'test-api-key'
process.env['SSE_API_KEY'] ??= 'sse-test-api-key'

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

describe('Oanda handles SSE connection with multiple correct and incorrect asset pairs', async () => {
  const clock = FakeTimers.install()

  mockSSE()
  mockRESTInstruments()
  mockRESTPrice()

  const api = await expose(adapter)
  const address = `http://localhost:${(api?.server?.address() as AddressInfo)?.port}`

  for (const { request, response } of IO) {
    test(`Test { base: ${request.data.base}, quote: ${request.data.quote} } request`, async () => {
      const makeRequest = () => axios.post(address, request)

      const primerError = (await makeRequest()) as unknown as AxiosError | undefined

      expect(primerError?.response?.status).toEqual(HTTP_GATEWAY_TIMEOUT)

      switch (response.statusCode) {
        case HTTP_OK: {
          await clock.tickAsync(BACKGROUND_EXECUTE_MS)

          const res = await makeRequest()

          expect(res.status).toEqual(response.statusCode)
          assertEqualResponses(res.data, response)

          break
        }
        case HTTP_GATEWAY_TIMEOUT: {
          await clock.tickAsync(CACHE_EXPIRATION_MS + BACKGROUND_EXECUTE_MS)

          const error = (await makeRequest()) as unknown as AxiosError | undefined

          expect(error?.response?.status).toEqual(HTTP_GATEWAY_TIMEOUT)

          break
        }
        default: {
          throw Error(`No handler for status: ${response.statusCode}`)
        }
      }
    })

    await clock.tickAsync(BACKGROUND_EXECUTE_MS + CACHE_SET_MS)
  }

  clock.uninstall()
})
