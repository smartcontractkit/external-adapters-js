import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

const msolUsdResponse = {
  asset_code: 'Crypto:MSOL/USD',
  block_time: '2026-06-01T23:56:57.116337426Z',
  price: '111.9637335489480836',
  base_symbol: 'MSOL',
  quote_symbol: 'USD',
  depth_usd_plus: '6245764.87954388',
  depth_usd_min: '6183782.58210092',
  volume_7d_usd: '3185001.4416',
}

const btcUsdResponse = {
  asset_code: 'Crypto:BTC/USD',
  block_time: '2026-06-01T23:56:56Z',
  price: '71282.068872305725',
  base_symbol: 'BTC',
  quote_symbol: 'USD',
  depth_usd_plus: '0',
  depth_usd_min: '0',
  volume_7d_usd: '0',
}

export const mockWebsocketServerMultiPair = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      socket.send(JSON.stringify(msolUsdResponse))
      socket.send(JSON.stringify(btcUsdResponse))
    })
  })
  return mockWsServer
}

// Full quote frame (k = "quote") with bid/ask and volumes
const aaplUsdQuote = {
  k: 'quote',
  c: 'Equity:US:AAPL/USD',
  s: 'AAPL/USD',
  m: '190.12',
  b: '190.10',
  a: '190.14',
  bv: '300',
  av: '200',
  lp: '190.11',
  t: 1780358217000,
}

// Quote frame with missing bid/ask; the transport falls back to mid for both
const spyUsdQuote = {
  k: 'quote',
  c: 'ETF:US:SPY/USD',
  s: 'SPY/USD',
  m: '530.25',
  bv: '0',
  av: '0',
  lp: '530.2',
  t: 1780358218000,
}

// Quote frame with missing bid/ask volume; only rejected when requireVolume is set
const msftUsdQuote = {
  k: 'quote',
  c: 'Equity:US:MSFT/USD',
  s: 'MSFT/USD',
  m: '410.50',
  b: '410.45',
  a: '410.55',
  lp: '410.48',
  t: 1780358220000,
}

// Index value frame (k = "value"); the only price field is v
const spxUsdValue = {
  k: 'value',
  c: 'Index:US:SPX/USD',
  s: 'SPX/USD',
  v: '5321.45',
  t: 1780358219000,
}

// Full quote frame for a pair that is only subscribed after another pair has been reported as not found
const nvdaUsdQuote = {
  k: 'quote',
  c: 'Equity:US:NVDA/USD',
  s: 'NVDA/USD',
  m: '880.50',
  b: '880.40',
  a: '880.60',
  bv: '150',
  av: '120',
  lp: '880.45',
  t: 1780358221000,
}

const stockQuoteFrames: Record<string, Record<string, string | number>> = {
  [aaplUsdQuote.c]: aaplUsdQuote,
  [spyUsdQuote.c]: spyUsdQuote,
  [msftUsdQuote.c]: msftUsdQuote,
  [spxUsdValue.c]: spxUsdValue,
  [nvdaUsdQuote.c]: nvdaUsdQuote,
}

// Mirrors the live Nobi v1 server: a subscribe_market_data with an empty pair list or any unknown
// pair gets a single error frame and the connection is then closed, with no data sent for the
// other pairs in that message. A valid subscribe is acknowledged and answered with one frame per
// pair. Each received subscribe is appended to subscribedPairs so tests can assert on exactly which
// pairs the transport asked for.
export const mockStockQuotesWebsocketServer = (
  URL: string,
  subscribedPairs: string[][] = [],
): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (message) => {
      const parsed = JSON.parse(message.toString())
      if (parsed.method !== 'subscribe_market_data') {
        return
      }
      const pairs: string[] = parsed.params.pairs
      subscribedPairs.push(pairs)

      if (pairs.length === 0) {
        socket.send(
          JSON.stringify({ method: 'error', code: '50004', message: 'Pairs is required' }),
        )
        socket.close()
        return
      }

      const unknownPair = pairs.find((pair) => !stockQuoteFrames[pair])
      if (unknownPair) {
        socket.send(
          JSON.stringify({
            method: 'error',
            code: '50104',
            message: `pair not found: ${unknownPair}`,
          }),
        )
        socket.close()
        return
      }

      socket.send(
        JSON.stringify({ method: 'subscribe_market_data', message: 'Success', code: '200' }),
      )
      for (const pair of pairs) {
        socket.send(JSON.stringify(stockQuoteFrames[pair]))
      }
    })
  })
  return mockWsServer
}
