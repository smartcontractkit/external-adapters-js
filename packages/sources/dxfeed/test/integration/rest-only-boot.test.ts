import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { FAKE_REST_ENDPOINT, mockBatchedRestTransport } from './rest-mocks'

/**
 * REST-path proving test (OPDATA-9200): the untouched REST transport
 * (owner decision rest_transport_scope=keep_untouched) serves requests
 * unchanged. Round-2 (CONF-ENV-MISMATCH) makes API_USERNAME, API_PASSWORD and
 * WS_API_ENDPOINT startup-required (spec environment_variables required: true
 * — the dxLink WS transport cannot start without them), so the boot environment
 * now carries the three WS vars alongside the REST one; the REST request path
 * itself is untouched by them.
 */

describe('REST boot (untouched REST transport)', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    // Round-2 (CONF-ENV-MISMATCH): the three WS vars are startup-required, so
    // the boot environment sets them — fake hosts only (test_fake_urls)
    process.env['API_USERNAME'] = 'dxfeed-user'
    process.env['API_PASSWORD'] = 'dxfeed-pass'
    process.env['WS_API_ENDPOINT'] = 'wss://dxlink.fake.test/dxlink-chainlink'
    // Fake REST host (test_fake_urls): the untouched REST transport reads
    // API_ENDPOINT from settings, so the nock interceptor in rest-mocks.ts is
    // what the requests hit — never a real provider host
    process.env['API_ENDPOINT'] = FAKE_REST_ENDPOINT

    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    // Batched REST mock (the untouched REST transport batches the desired
    // symbol set into one request); see rest-mocks.ts
    mockBatchedRestTransport()
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    // cleanAll only: nock.restore() kills the interceptor process-wide, so any
    // suite sharing this jest worker afterwards would hit real DNS instead of
    // its mock (the repo-wide teardown convention)
    nock.cleanAll()
    spy.mockRestore()
  })

  it('boots and serves a price request through the untouched REST transport', async () => {
    // No transport param: the request falls through to defaultTransport "rest"
    // (owner decision rest_transport_scope=keep_untouched). The nock
    // interception on the fake REST host is the proof the REST transport
    // handled it — and that the WS transport played no part.
    const response = await testAdapter.request({ base: 'TSLA', to: 'USD' })
    expect(response.statusCode).toBe(200)
    // Spec price response shape: data.result and result carry the provider's
    // last trade price (endpoint_request_response_examples.price)
    expect(response.json()).toMatchObject({
      data: { result: 239.255 },
      result: 239.255,
    })
  })

  it('still resolves overrides on the REST path', async () => {
    // Spec endpoint_request_response_examples request shape: the override layer
    // is preserved untouched by the migration ("overrides": "preserve"). The
    // dxfeed override resolves base AAPL -> IBM before the untouched REST
    // transport builds its request, and the served value is the resolved
    // symbol's provider price from the fake-host mock.
    const response = await testAdapter.request({
      base: 'AAPL',
      to: 'USD',
      overrides: {
        dxfeed: {
          AAPL: 'IBM',
        },
      },
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      data: { result: 142.5 },
      result: 142.5,
    })
  })
})
