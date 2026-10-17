import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { mockBatchedRestTransport } from './rest-mocks'

/**
 * REST price transport smoke flow (spec OPDATA-9200).
 *
 * The REST transport (transport/price-http.ts) and its config are explicitly
 * out of scope of the dxLink migration (owner decision
 * rest_transport_scope = keep_untouched): the price endpoint's
 * defaultTransport stays "rest" and a request without a transport param is
 * served by this untouched REST path.
 *
 * The credential pair (API_USERNAME/API_PASSWORD) is required: true at the
 * AdapterConfig level (spec environment_variables; startup gate proven in
 * test/unit/config.test.ts), so this suite boots with a fake pair set. The
 * WS-path request-time env checks those tests cover stay out of scope here:
 * this suite owns only the untouched defaultTransport "rest" smoke flow.
 */
describe('price REST transport (defaultTransport rest, keep_untouched)', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    // The credential pair is required at the config level (spec
    // environment_variables required: true) — boot needs a fake pair set
    // whatever previous suites left behind
    process.env['API_USERNAME'] = process.env['API_USERNAME'] ?? 'fake-api-username'
    process.env['API_PASSWORD'] = process.env['API_PASSWORD'] ?? 'fake-api-password'
    // Required at the config level; a clean wss:// dxLink URL (never a
    // cometd path, no embedded credentials)
    process.env['WS_API_ENDPOINT'] = 'wss://dxlink.localhost.invalid/dxlink-chainlink'

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

  // The former "WS-path credential gate" case (boot without the credential
  // pair, expect a 400 on stock_quotes) no longer exists as an integration
  // scenario: the spec environment_variables table marks the pair required:
  // true at the AdapterConfig level, so an adapter without credentials never
  // boots. The startup failure and the WS-path request-time checks are proven
  // in test/unit/config.test.ts.
})
