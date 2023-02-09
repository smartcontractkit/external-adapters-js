// import test from 'ava'
// import FakeTimers from '@sinonjs/fake-timers'
// import axios, { AxiosError, AxiosRequestConfig } from 'axios'
// import { SettingsMap } from '../../src/config'
// import { AddressInfo } from 'net'
// import { expose } from '../../src'
// import { Adapter, AdapterEndpoint } from '../../src/adapter'
// import { SseTransport, SSEConfig } from '../../src/transports'
// import { ProviderResult, SingleNumberResultResponse } from '../../src/util'
// import { InputParameters } from '../../src/validation'
// import { assertEqualResponses, MockCache, runAllUntilTime } from '../util'
// import nock from 'nock'
// const { MockEvent, EventSource } = require('mocksse') // eslint-disable-line
// const URL = 'http://test.com'

// interface AdapterRequestParams {
//   base: string
//   quote: string
// }

// export const inputParameters: InputParameters = {
//   base: {
//     type: 'string',
//     required: true,
//   },
//   quote: {
//     type: 'string',
//     required: true,
//   },
// }

// type StreamEndpointTypes = {
//   Request: {
//     Params: AdapterRequestParams
//   }
//   Response: SingleNumberResultResponse
//   CustomSettings: SettingsMap
//   Provider: {
//     RequestBody: never
//   }
// }

// export const sseTransport: SseTransport<StreamEndpointTypes> = new SseTransport({
//   prepareSSEConnectionConfig: (): SSEConfig => {
//     return { url: URL }
//   },
//   prepareKeepAliveRequest: (): AxiosRequestConfig<never> => {
//     const axiosRequestConfig: AxiosRequestConfig<never> = {
//       method: 'POST',
//       url: `${URL}/ping`,
//     }
//     return axiosRequestConfig
//   },
//   prepareSubscriptionRequest: (): AxiosRequestConfig<never> => {
//     const axiosConfig: AxiosRequestConfig<never> = {
//       method: 'POST',
//       url: `${URL}/sub`,
//     }
//     return axiosConfig
//   },
//   prepareUnsubscriptionRequest: (): AxiosRequestConfig<never> => {
//     const axiosConfig: AxiosRequestConfig<never> = {
//       method: 'POST',
//       url: `${URL}/unsub`,
//     }
//     return axiosConfig
//   },
//   eventListeners: [
//     {
//       type: 'price',
//       parseResponse: (evt: MessageEvent): ProviderResult<StreamEndpointTypes>[] => {
//         return [
//           {
//             params: { base: evt.data.base, quote: evt.data.quote },
//             response: {
//               data: {
//                 result: evt.data.price,
//               },
//               result: evt.data.price,
//             },
//           },
//         ]
//       },
//     },
//   ],
// })

// export const sseEndpoint = new AdapterEndpoint({
//   name: 'test',
//   transport: sseTransport,
//   inputParameters,
// })

// const CACHE_MAX_AGE = 4000
// const BACKGROUND_EXECUTE_MS_SSE = 5000

// // Disable retries to make the testing flow easier
// process.env['CACHE_POLLING_MAX_RETRIES'] = '0'

// const adapter = new Adapter({
//   name: 'TEST',
//   defaultEndpoint: 'test',
//   endpoints: [sseEndpoint],
//   envDefaultOverrides: {
//     CACHE_MAX_AGE,
//     BACKGROUND_EXECUTE_MS_SSE,
//   },
// })

// test('connects to EventSource, subscribes, gets message, unsubscribes and handles misconfigured subscription', async (t) => {
//   const clock = FakeTimers.install()

//   // Mocks SSE events which are handled by the mock EventListener dependency
//   mockSSE()
//   mockHTTP()

//   const base = 'ETH'
//   const quote = 'USD'
//   const price = 111

//   // Create mocked cache so we can listen when values are set
//   // This is a more reliable method than expecting precise clock timings
//   // Also use the mock event source provided by mocksee
//   const mockCache = new MockCache(adapter.config.CACHE_MAX_ITEMS)
//   // Start up adapter
//   const api = await expose(adapter, {
//     cache: mockCache,
//     eventSource: EventSource,
//   })
//   const address = `http://localhost:${(api?.server?.address() as AddressInfo)?.port}`

//   const makeRequest = () =>
//     axios.post(address, {
//       data: {
//         base,
//         quote,
//       },
//     })

//   // Expect the first response to time out
//   // The polling behavior is tested in the cache tests, so this is easier here.
//   // Start the request:
//   const earlyErrorPromise: Promise<AxiosError | undefined> = t.throwsAsync(makeRequest)
//   // Advance enough time for the initial request async flow
//   // clock.tickAsync(10)
//   // Wait for the failed cache get -> instant 504
//   const earlyError = await earlyErrorPromise
//   t.is(earlyError?.response?.status, 504)

//   // Advance clock so that the batch warmer executes once again and wait for the cache to be set
//   const cacheValueSetPromise = mockCache.waitForNextSet()
//   await runAllUntilTime(clock, BACKGROUND_EXECUTE_MS_SSE + 10)
//   await cacheValueSetPromise

//   // Second request should find the response in the cache
//   const response = await makeRequest()

//   t.is(response.status, 200)
//   assertEqualResponses(t, response.data, {
//     data: { result: 111 },
//     result: price,
//     statusCode: 200,
//   })

//   // Handles misconfigured subscription

//   // Make a request for an unsupported ticker symbol
//   const makeBadRequest = () =>
//     axios.post(address, {
//       data: {
//         base: 'NONE',
//         quote: 'USD',
//       },
//     })

//   await clock.tickAsync(BACKGROUND_EXECUTE_MS_SSE + 10)

//   // Expect the request to fail since the token is invalid
//   const errorPromise: Promise<AxiosError | undefined> = t.throwsAsync(makeBadRequest)
//   // Advance enough time for the initial request async flow
//   // clock.tickAsync(10)
//   // Wait for the failed cache get -> instant 504
//   const error = await errorPromise
//   t.is(error?.response?.status, 504)

//   // Wait until the cache expires, and the subscription is out
//   await clock.tickAsync(11000)

//   // Now that the cache is out and the subscription no longer there, this should time out
//   const error2: AxiosError | undefined = await t.throwsAsync(makeRequest)
//   t.is(error2?.response?.status, 504)

//   clock.uninstall()
// })

// const mockSSE = () => {
//   const mock = new MockEvent({
//     url: URL,
//     setInterval: 10,
//     responses: [
//       {
//         type: 'price',
//         data: { base: 'ETH', quote: 'USD', price: 111 },
//         lastEventId: '0000000',
//         origin: URL,
//       },
//     ],
//   })
//   return mock
// }

// const mockHTTP = () => {
//   nock('http://test.com')
//     .post('/sub')
//     .times(2)
//     .reply(200, {
//       message: 'Successfully subscribed to ETH/USD',
//     })
//     .post('/unsub')
//     .times(2)
//     .reply(200, {
//       message: 'Successfully unsubscribed from ETH/USD',
//     })
//     .post('/ping')
//     .times(9999999)
//     .reply(200, {
//       message: 'Pong',
//     })
// }
