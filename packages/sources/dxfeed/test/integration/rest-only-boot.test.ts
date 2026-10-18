import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { FAKE_REST_ENDPOINT, mockBatchedRestTransport } from './rest-mocks'

/**
 * REST contract flow (OPDATA-9200): the untouched REST transport (owner
 * decision rest_transport_scope=keep_untouched) serves requests unchanged.
 *
 * Spec environment_variables declare API_USERNAME, API_PASSWORD and
 * WS_API_ENDPOINT required:true, so every boot carries the WS credential
 * triple; the REST path (defaultTransport "rest") still serves from
 * API_ENDPOINT alone, resolved overrides included. The startup-rejection
 * half (a boot with none of the three WS vars set) is proven in
 * breaking-change-config.test.ts through adapter.initialize().
 */
describe('REST contract under the required config surface', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    // The WS credential triple is required at startup (spec
    // environment_variables) — fake values satisfy it without touching a host
    process.env['API_USERNAME'] = 'fake-api-username'
    process.env['API_PASSWORD'] = 'fake-api-password'
    process.env['WS_API_ENDPOINT'] = 'wss://dxlink.fake.test/dxlink-chainlink'
    // Fake REST host (test_fake_urls): the untouched REST transport reads
    // API_ENDPOINT from settings, so the nock interceptor in rest-mocks.ts is
    // what the requests hit — never a real provider host
    process.env['API_ENDPOINT'] = FAKE_REST_ENDPOINT

    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    // Boot itself is the first assertion: the required triple plus a fake REST
    // endpoint is a valid startup environment (batched REST mock — the
    // untouched REST transport batches the desired symbol set into one
    // request; see rest-mocks.ts)
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

  it('serves a price request through the untouched REST transport (defaultTransport rest)', async () => {
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
