// TODO: update the import paths to target your transport implementation.
import { httpTransport } from '../../../src/transport/price-http'
import type { HttpTransportTypes } from '../../../src/transport/price-http'

/**
 * TEMPLATE: HTTP transport behaviour tests.
 */

const SAMPLE_PARAMS = [
  {
    base: 'ETH',
    quote: 'USD',
  },
] as unknown as HttpTransportTypes['Parameters'][]

const SAMPLE_SETTINGS = {
  API_ENDPOINT: 'https://example.provider/api',
  API_KEY: 'example-key',
} as HttpTransportTypes['Settings']

describe.skip('HTTP transport template', () => {
  it('builds provider requests from params', () => {
    const requests = httpTransport.prepareRequests?.(SAMPLE_PARAMS, SAMPLE_SETTINGS) ?? []
    expect(requests).toHaveLength(1)

    const [{ request }] = requests
    expect(request.baseURL).toBe(SAMPLE_SETTINGS.API_ENDPOINT)
    expect(request.headers).toMatchObject({
      X_API_KEY: SAMPLE_SETTINGS.API_KEY,
    })
  })

  it('parses successful responses into cache payloads', () => {
    const response = {
      data: {
        ETH: {
          price: 2000,
        },
      },
    } as HttpTransportTypes['Provider']['ResponseBody']

    const parsed = httpTransport.parseResponse?.(SAMPLE_PARAMS, { data: response } as any) ?? []
    expect(parsed).toHaveLength(1)
    expect(parsed[0].response?.result).toBe(2000)
  })

  it('returns provider error metadata when payload missing', () => {
    const parsed = httpTransport.parseResponse?.(SAMPLE_PARAMS, { data: undefined } as any) ?? []
    expect(parsed).toHaveLength(1)
    expect(parsed[0].response?.errorMessage).toContain("didn't return any value")
    expect(parsed[0].response?.statusCode).toBe(502)
  })
})

