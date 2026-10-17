import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { FAKE_REST_ENDPOINT, mockBatchedRestTransport } from './rest-mocks'

/**
 * Plan item proving test (OPDATA-9200): WS_API_ENDPOINT is NOT required at
 * startup — a REST-only dxfeed deployment (owner decision
 * rest_transport_scope=keep_untouched: RDD's 3 lastTradedPrice params without a
 * transport param fall through to defaultTransport rest) must boot and serve
 * the REST path with WS_API_ENDPOINT unset. The WS paths stay gated at REQUEST
 * time (wsEnvInputValidationError), not at boot.
 */

describe('REST-only deployment (WS_API_ENDPOINT unset)', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_USERNAME'] = process.env['API_USERNAME'] ?? 'fake-api-username'
    process.env['API_PASSWORD'] = process.env['API_PASSWORD'] ?? 'fake-api-password'
    // The point of this suite: no WS_API_ENDPOINT at all
    delete process.env['WS_API_ENDPOINT']
    // Fake REST host (test_fake_urls): the untouched REST transport reads
    // API_ENDPOINT from settings, so the nock interceptor in rest-mocks.ts is
    // what the requests hit — never a real provider host
    process.env['API_ENDPOINT'] = FAKE_REST_ENDPOINT

    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    // Boot itself is the first assertion: with WS_API_ENDPOINT still required at
    // startup this start call throws and every test below fails
    mockBatchedRestTransport()
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  it('boots without WS_API_ENDPOINT and serves a REST price request', async () => {
    // No transport param: the request falls through to defaultTransport "rest"
    // (owner decision rest_transport_scope=keep_untouched). The nock
    // interception on the fake REST host is the proof the REST transport
    // handled it.
    const response = await testAdapter.request({ base: 'TSLA', to: 'USD' })
    expect(response.statusCode).toBe(200)
    // Spec price response shape: data.result and result carry the provider's
    // last trade price (endpoint_request_response_examples.price)
    expect(response.json()).toMatchObject({
      data: { result: 239.255 },
      result: 239.255,
    })
  })

  it('rejects a WS-path request at request time while WS_API_ENDPOINT is unset', async () => {
    // The WS-path env gate (wsEnvInputValidationError) owns the requirement at
    // request time: a stock_quotes request (WS-only path) errors with the
    // WS_API_ENDPOINT message instead of booting the adapter down.
    const response = await testAdapter.request({
      endpoint: 'stock_quotes',
      base: 'AAPL',
      to: 'USD',
    })
    expect(response.statusCode).toBe(400)
    expect(JSON.stringify(response.json())).toContain(
      'WS_API_ENDPOINT is required for dxfeed websocket requests',
    )
  })

  it('rejects an explicit transport="ws" price request at request time while WS_API_ENDPOINT is unset', async () => {
    const response = await testAdapter.request({
      endpoint: 'stock',
      base: 'AAPL',
      to: 'USD',
      transport: 'ws',
    })
    expect(response.statusCode).toBe(400)
    expect(JSON.stringify(response.json())).toContain(
      'WS_API_ENDPOINT is required for dxfeed websocket requests',
    )
  })
})
