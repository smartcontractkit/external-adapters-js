import nock from 'nock'

/**
 * REST transport mock for the untouched (pre-migration, batched) price HTTP
 * transport. The transport batches every desired subscription into ONE request
 * (`symbols=A,B,C` — the subscription set accumulates across requests because
 * the tests freeze Date.now, so per-symbol exact nock interceptors never match
 * later batches). This mock reads the requested symbols off the query and
 * replies with a Trade entry per known symbol; a batch that carries a FAIL
 * symbol gets a persistent 500 so the upstream-failure flows stay testable.
 */
const REST_PRICES: Record<string, number> = { TSLA: 239.255, IBM: 142.5 }

const tradeEntry = (symbol: string, price: number) => ({
  eventSymbol: symbol,
  eventTime: 0,
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

export function mockBatchedRestTransport(): void {
  // Registered first so a batch that includes the FAIL symbol hits the 5xx
  // reply even though the catch-all success interceptor below would also match
  nock('https://tools.dxfeed.com/webservice/rest')
    .persist()
    .get('/events.json')
    .query((query) => String(query.symbols ?? '').includes('FAIL'))
    .reply(500, { status: 'INTERNAL_SERVER_ERROR' }, ['Content-Type', 'application/json'])

  nock('https://tools.dxfeed.com/webservice/rest')
    .persist()
    .get('/events.json')
    .query(true)
    .reply((uri) => {
      const symbols = new URL(uri, 'https://tools.dxfeed.com').searchParams.get('symbols') ?? ''
      const trade: Record<string, unknown> = {}
      for (const symbol of symbols.split(',')) {
        const price = REST_PRICES[symbol]
        if (price !== undefined) {
          trade[symbol] = tradeEntry(symbol, price)
        }
      }
      return [200, { status: 'OK', Trade: trade }, ['Content-Type', 'application/json']]
    })
}
