import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { FAKE_REST_ENDPOINT, mockBatchedRestTransport } from './rest-mocks'

/**
 * REST price transport smoke flow (spec OPDATA-9200).
 *
 * The REST transport (transport/price-http.ts) and its config are explicitly
 * out of scope of the dxLink migration (owner decision
 * rest_transport_scope = keep_untouched): the price endpoint's
 * defaultTransport stays "rest" and a request without a transport param is
 * served by this untouched REST path.
 *
 * The credential pair and WS_API_ENDPOINT are set for boot (both required at
 * startup per the spec env block). The WS-path request-time env checks stay
 * out of scope here: this suite owns only the untouched defaultTransport
 * "rest" smoke flow.
 */
describe('price REST transport (defaultTransport rest, keep_untouched)', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    // A fake pair and a clean dxLink URL: the credential pair and
    // WS_API_ENDPOINT are both required at boot (spec env block) — all set so
    // the WS-path input-validation gate can never trip
    process.env['API_USERNAME'] = process.env['API_USERNAME'] ?? 'fake-api-username'
    process.env['API_PASSWORD'] = process.env['API_PASSWORD'] ?? 'fake-api-password'
    // A clean wss:// dxLink URL (never a cometd path, no embedded credentials)
    process.env['WS_API_ENDPOINT'] = 'wss://dxlink.localhost.invalid/dxlink-chainlink'
    // Fake REST host (test_fake_urls): the untouched REST transport reads
    // API_ENDPOINT from settings, so the nock interceptor in rest-mocks.ts is
    // what the requests hit — never a real provider host
    process.env['API_ENDPOINT'] = FAKE_REST_ENDPOINT

    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    // Batched REST mock (the untouched transport batches the desired symbol
    // set into one request); see rest-mocks.ts
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

  describe('happy path', () => {
    it('serves the REST Trade fixture for a request without transport', async () => {
      // Routing pair, REST half (the transport="ws" half lives in
      // adapter-ws.test.ts): a request without a transport param is served by
      // the defaultTransport "rest". No endpoint param: the adapter default
      // endpoint is price. The nock interception on the untouched REST host is
      // the proof the REST transport handled the request.
      const response = await testAdapter.request({
        base: 'TSLA',
        to: 'USD',
      })
      expect(response.statusCode).toBe(200)
      // Spec price response shape: data.result and result carry the provider's
      // last trade price (endpoint_request_response_examples.price)
      expect(response.json()).toMatchObject({
        data: { result: 239.255 },
        result: 239.255,
      })
    })

    it('serves the REST fixture for an explicit transport="rest" request', async () => {
      // Spec price input_parameters: transport is optional, "ws" or "rest".
      // A distinct symbol forces a distinct request path so the nock
      // interception itself proves which transport served the request.
      const response = await testAdapter.request({
        endpoint: 'stock',
        base: 'IBM',
        to: 'USD',
        transport: 'rest',
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        data: { result: 142.5 },
        result: 142.5,
      })
    })
  })

  describe('upstream failures', () => {
    it('maps an upstream 5xx to an adapter error', async () => {
      // The FAIL symbol flips the persistent batched interceptor to a 500
      // reply; the framework retries (requester RETRY plus background cycles)
      // and the interceptor absorbs every attempt, so none reaches the real
      // provider host. The framework maps the upstream failure onto a flat
      // 502 error result for every param of the batched request.
      const response = await testAdapter.request({ base: 'FAIL', to: 'USD' })
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchObject({
        errorMessage: expect.stringContaining('Provider request failed with status 500'),
      })
    })
  })

  // The WS-path env checks (cometd path, embedded credentials, credential
  // pair, WS_API_ENDPOINT presence) are proven in
  // test/unit/config/env-validation.test.ts and the WS suites.
})
