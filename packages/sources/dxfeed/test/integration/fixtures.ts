import nock from 'nock'

// Deterministic cache polling for the adapter-under-test (framework env).
process.env.CACHE_POLLING_MAX_RETRIES = '20'
process.env.CACHE_POLLING_SLEEP_MS = '500'

export function mockPriceEndpoint(): nock.Scope {
  return nock('https://tools.dxfeed.com/webservice/rest', { encodedQueryParams: true })
    .get('/events.json')
    .query({ events: 'Trade,Quote', symbols: 'TSLA' })
    .reply(
      200,
      {
        status: 'OK',
        Trade: {
          TSLA: {
            eventSymbol: 'TSLA',
            eventTime: 0,
            time: 1636744209248,
            timeNanoPart: 0,
            sequence: 775394,
            exchangeCode: 'V',
            price: 239.255,
            change: 0.03,
            size: 3,
            dayVolume: 700004,
            dayTurnover: 167577930,
            tickDirection: 'ZERO_UP',
            extendedTradingHours: false,
          },
        },
      },
      [
        'Server',
        'nginx',
        'Date',
        'Fri, 12 Nov 2021 19:10:13 GMT',
        'Content-Type',
        'application/json',
        'Transfer-Encoding',
        'chunked',
        'Connection',
        'close',
        'X-Origin-Nginx',
        'tools1',
        'Access-Control-Allow-Origin',
        '*',
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS',
        'Access-Control-Max-Age',
        '86400',
        'X-Origin-Nginx',
        'tools1',
      ],
    )
    .persist()
}

/**
 * Batch-tolerant REST mock (framework HttpTransport batching): the transport's
 * prepareRequests folds ALL desired params of the shared adapter into ONE
 * request (symbols=NVDA,XAU,...), and the background batch loop re-fetches
 * every still-desired symbol on each interval — including symbols registered
 * by earlier tests. The registry therefore ACCUMULATES registrations across
 * tests, the interceptor matches when ANY requested symbol is registered, and
 * the reply is built at request time for EVERY requested symbol (a symbol
 * missing from the registry replies null -> the adapter's 502 path).
 */
const symbolPriceRegistry = new Map<string, number | null>()

export function mockPriceEndpointWithSymbols(symbols: Record<string, number | null>): nock.Scope {
  for (const [symbol, price] of Object.entries(symbols)) {
    symbolPriceRegistry.set(symbol, price)
  }
  return nock('https://tools.dxfeed.com/webservice/rest', { encodedQueryParams: true })
    .get('/events.json')
    .query((actualQuery) => {
      return (
        actualQuery.events === 'Trade,Quote' &&
        typeof actualQuery.symbols === 'string' &&
        actualQuery.symbols.split(',').some((symbol: string) => symbolPriceRegistry.has(symbol))
      )
    })
    .reply((uri) => {
      const url = new URL(uri, 'https://tools.dxfeed.com')
      const requestedSymbols = (url.searchParams.get('symbols') || '').split(',')
      return [
        200,
        {
          status: 'OK',
          Trade: Object.fromEntries(
            requestedSymbols.map((symbol) => [
              symbol,
              {
                eventSymbol: symbol,
                eventTime: 0,
                time: 1636744209248,
                timeNanoPart: 0,
                sequence: 775394,
                exchangeCode: 'V',
                price: symbolPriceRegistry.get(symbol) ?? null,
                change: 0.03,
                size: 3,
                dayVolume: 700004,
                dayTurnover: 167577930,
                tickDirection: 'ZERO_UP',
                extendedTradingHours: false,
              },
            ]),
          ),
        },
        [
          'Server',
          'nginx',
          'Date',
          'Fri, 12 Nov 2021 19:10:13 GMT',
          'Content-Type',
          'application/json',
          'Transfer-Encoding',
          'chunked',
          'Connection',
          'close',
          'X-Origin-Nginx',
          'tools1',
          'Access-Control-Allow-Origin',
          '*',
          'Access-Control-Allow-Methods',
          'GET, POST, OPTIONS',
          'Access-Control-Max-Age',
          '86400',
          'X-Origin-Nginx',
          'tools1',
        ],
      ]
    })
    .persist()
}
