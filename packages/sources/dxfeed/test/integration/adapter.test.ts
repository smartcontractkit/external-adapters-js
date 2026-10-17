import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { mockBatchedRestTransport } from './rest-mocks'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_USERNAME'] = 'fake-api-username'
    process.env['API_PASSWORD'] = 'fake-api-password'
    // Required at startup alongside the credentials; only the REST transport is exercised here
    process.env['WS_API_ENDPOINT'] = 'wss://dxlink.localhost.invalid/dxlink-chainlink'
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
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('price endpoint rest', () => {
    it('should return success', async () => {
      const data = {
        base: 'TSLA',
        to: 'USD',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      // Spec price response shape: data.result and result carry the provider's
      // last trade price (endpoint_request_response_examples.price).
      expect(response.json()).toMatchObject({
        data: { result: 239.255 },
        result: 239.255,
      })
    })

    it('routes an explicit transport="rest" request to the REST transport', async () => {
      // Spec price input_parameters: transport is optional, "ws" or "rest";
      // defaultTransport stays "rest" (owner decision rest_transport_scope).
      // A distinct symbol forces a distinct request path so the nock
      // interception itself proves which transport served the request.
      const response = await testAdapter.request({
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

  describe('validation errors', () => {
    it('fails on an empty request', async () => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchObject({ error: expect.anything() })
    })

    it('fails on a missing base', async () => {
      const response = await testAdapter.request({ endpoint: 'stock_quotes', to: 'USD' })
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchObject({ error: expect.anything() })
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
})
