import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { endpoint } from '../../../src/endpoint/price'
import { buildDxFeedHttpTransport } from '../../../src/transport/price-http'
import restResponse from '../fixtures/rest-provider-response.json'

// The transport module logs via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

/**
 * Plan item rest-transport-preserve proving test (owner decision
 * rest_transport_scope=keep_untouched): a price request without a transport
 * param routes to the REST transport and the untouched REST hooks still map a
 * provider response onto a result. The mocked-HTTP end-to-end flow lives in
 * test/integration/price-http.test.ts; this file pins the adapter-authored
 * hooks themselves (the auth-request-body and parse-frame substitutions the
 * migration must not have touched).
 */
const transport = buildDxFeedHttpTransport()

const hooks = (
  transport as unknown as {
    config: {
      prepareRequests: (
        params: { base: string }[],
        settings: Record<string, string | undefined>,
      ) => { params: { base: string }[]; request: Record<string, any> }
      parseResponse: (
        params: { base: string }[],
        res: { data: unknown },
      ) => { params: { base: string }; response: Record<string, any> }[]
    }
  }
).config

const SETTINGS = {
  API_ENDPOINT: 'https://rest.fake.test/webservice/rest',
  API_USERNAME: 'dxfeed-user',
  API_PASSWORD: 'dxfeed-pass',
}

describe('price request without a transport param routes to the REST transport', () => {
  it('a request with no transport param resolves to the defaultTransport rest', () => {
    const request = { body: { data: { base: 'AAPL', quote: 'USD' } } } as any
    expect(endpoint.getTransportNameForRequest(request, {} as any)).toBe('rest')
  })
})

describe('preserved REST request shape (prepareRequests)', () => {
  it('batches the upper-cased, deduped symbol set into one GET /events.json on API_ENDPOINT with the Basic credentials attached', () => {
    const { request } = hooks.prepareRequests(
      [{ base: 'aapl:uslf24' }, { base: 'AAPL:USLF24' }, { base: 'SPCX' }],
      SETTINGS,
    )

    expect(request).toEqual({
      baseURL: 'https://rest.fake.test/webservice/rest',
      url: '/events.json',
      method: 'GET',
      params: { events: 'Trade,Quote', symbols: 'AAPL:USLF24,SPCX' },
      auth: { username: 'dxfeed-user', password: 'dxfeed-pass' },
    })
  })

  it('attaches no auth block when the credential pair is unset (preserved pre-migration behavior)', () => {
    const { request } = hooks.prepareRequests([{ base: 'AAPL' }], {
      API_ENDPOINT: 'https://rest.fake.test/webservice/rest',
      API_USERNAME: undefined,
      API_PASSWORD: undefined,
    })

    expect(request).not.toHaveProperty('auth')
  })
})

describe('preserved REST response mapping (parseResponse)', () => {
  it('maps a Trade event (ticker not in quoteSymbols.json) onto result=price per the spec price response_mapping', () => {
    // Spec endpoint_request_response_examples[1]: result 189.98
    const [result] = hooks.parseResponse([{ base: 'AAPL:USLF24' }], { data: restResponse })

    expect(result.response).toEqual({
      data: { result: 189.98 },
      result: 189.98,
    })
  })

  it('maps a Quote event (ticker keyed in quoteSymbols.json) onto result=bidPrice per the preserved REST mapping', () => {
    // quoteSymbols.json keys the Quote-event set; the spec stock_quotes
    // response_mapping reads bid_price off bidPrice
    const [result] = hooks.parseResponse([{ base: 'USO/USD:AFX' }], { data: restResponse })

    expect(result.response).toEqual({
      data: { result: 189.9 },
      result: 189.9,
    })
  })

  it('maps a symbol the provider sent no data for onto a 502 error result naming the token', () => {
    const [result] = hooks.parseResponse([{ base: 'NOPE' }], { data: restResponse })

    expect(result.response.statusCode).toBe(502)
    expect(result.response.errorMessage).toContain('NOPE')
  })
})
