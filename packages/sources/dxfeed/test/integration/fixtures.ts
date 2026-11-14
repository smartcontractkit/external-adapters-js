import nock from 'nock'

const REST_URL = 'https://tools.dxfeed.com/webservice/rest'

const REPLY_HEADERS = ['Content-Type', 'application/json', 'Connection', 'close']

const tradeEvent = (symbol: string, price: number | null) => ({
  eventSymbol: symbol,
  eventTime: 1636744209248,
  time: 1636744209248,
  timeNanoPart: 0,
  sequence: 775394,
  exchangeCode: 'V',
  price,
  change: 0.03,
  size: 3,
  dayVolume: 700004,
  dayTurnover: 167577930,
  tickDirection: 'ZERO_UP',
  extendedTradingHours: false,
})

/**
 * REST mock for one or more symbols. The transport batches desired params into
 * one request and re-fetches, so the scope is persistent and the price map is
 * local to this mock.
 */
export function mockPriceEndpointWithSymbols(symbols: Record<string, number | null>): nock.Scope {
  const prices = new Map(Object.entries(symbols))
  return nock(REST_URL, { encodedQueryParams: true })
    .get('/events.json')
    .query((query) => {
      const requested = typeof query.symbols === 'string' ? query.symbols.split(',') : []
      return query.events === 'Trade,Quote' && requested.some((symbol) => prices.has(symbol))
    })
    .reply((uri) => {
      const url = new URL(uri, REST_URL)
      const requested = (url.searchParams.get('symbols') ?? '').split(',')
      const trades = Object.fromEntries(
        requested.map((symbol) => [symbol, tradeEvent(symbol, prices.get(symbol) ?? null)]),
      )
      return [200, { status: 'OK', Trade: trades }, REPLY_HEADERS]
    })
    .persist()
}

export function mockPriceEndpoint(): nock.Scope {
  return mockPriceEndpointWithSymbols({ TSLA: 239.255 })
}
