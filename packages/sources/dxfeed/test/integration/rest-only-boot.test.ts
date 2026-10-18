import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { FAKE_REST_ENDPOINT, mockBatchedRestTransport } from './rest-mocks'

/**
 * REST-only boot smoke flow (OPDATA-9200): the untouched REST transport
 * (owner decision rest_transport_scope=keep_untouched) serves requests
 * unchanged from a pod that boots with ONLY API_ENDPOINT set.
 *
 * Plan item ws-env-triple-required-at-startup: the spec
 * breaking_change_env_checks scope the credential requirement to WS paths —
 * API_USERNAME, API_PASSWORD and WS_API_ENDPOINT are required: false at
 * startup, and the WS-path requirement is enforced at request time by
 * wsEnvInputValidationError (through the endpoints' customInputValidation).
 * A REST-only deployment must therefore boot AND serve with none of the three
 * WS vars set; a WS-transport request in that same state fails fast with the
 * request-time env validation error.
 */
describe('REST-only boot (no WS credential triple)', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    // The WS triple is required: false at startup — delete whatever the outer
    // environment leaked in, so this boot really is REST-only
    delete process.env['API_USERNAME']
    delete process.env['API_PASSWORD']
    delete process.env['WS_API_ENDPOINT']
    // Fake REST host (test_fake_urls): the untouched REST transport reads
    // API_ENDPOINT from settings, so the nock interceptor in rest-mocks.ts is
    // what the requests hit — never a real provider host
    process.env['API_ENDPOINT'] = FAKE_REST_ENDPOINT

    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    // Boot itself is the first assertion: with the WS triple required: false,
    // initialize() must accept an environment with none of the three set
    // (batched REST mock — the untouched REST transport batches the desired
    // symbol set into one request; see rest-mocks.ts)
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

  it('boots with only API_ENDPOINT and serves a price request through the untouched REST transport', async () => {
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

  it('returns the request-time env validation error for a WS-transport request in the same no-triple state', async () => {
    // The request-time half of the plan item: with no WS triple set, a request
    // whose resolved transport is ws fails fast at customInputValidation with
    // the env validation error naming the credentials (spec
    // breaking_change_env_checks: "require API_USERNAME and API_PASSWORD to be
    // set (WS paths)") — and never reaches a socket.
    const response = await testAdapter.request({
      endpoint: 'stock',
      base: 'AAPL',
      to: 'USD',
      transport: 'ws',
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ error: expect.anything() })
    // The error names the missing credential pair, wherever the framework
    // places the message in the error body
    expect(JSON.stringify(response.json())).toContain('API_USERNAME')
  })
})
