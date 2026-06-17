import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import * as nock from 'nock'
import {
  mockCompositeStockQuotesHttpNewerTimestamp,
  mockCompositeStockQuotesWsServer,
  mockResponseSuccess,
  mockStockWebSocketServer,
} from './fixtures'

// These tests require COMPOSITE_TRANSPORT=true, which activates the CompositeTransport path in
// AdapterEndpoint.initialize(). Without it, enableCompositeTransport: true in the endpoint config
// has no effect and routing falls back to customRouter / defaultTransport.
//
// With composite transport active:
// - Both WS and HTTP transports register and run simultaneously via Promise.allSettled
// - All writes go to a single shared cache key (the composite transport name)
// - CompareResponseCache only overwrites if providerIndicatedTimeUnixMs is strictly newer
//
// The two tests exercise opposite sides of the timestamp comparison:
//   stock_quotes: HTTP timestamp (9999999) > WS timestamp (1000)  → HTTP wins
//   stock:        WS timestamp (1646154954689) > HTTP timestamp (1628899200621) → WS wins

describe('composite transport', () => {
  let mockWsServerStockQuotes: MockWebsocketServer | undefined
  let mockWsServerStock: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  const wsEndpointStockQuotes = 'ws://localhost:9095'
  const wsEndpointStock = 'ws://localhost:9096'

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['COMPOSITE_TRANSPORT'] = 'true'
    process.env['STOCK_QUOTES_WS_API_ENDPOINT'] = wsEndpointStockQuotes
    process.env['STOCK_WS_API_ENDPOINT'] = wsEndpointStock
    process.env['WS_SOCKET_KEY'] = 'fake-api-key'
    process.env['API_KEY'] = 'fake-api-key'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServerStockQuotes = mockCompositeStockQuotesWsServer(wsEndpointStockQuotes)
    mockWsServerStock = mockStockWebSocketServer(wsEndpointStock)
    mockCompositeStockQuotesHttpNewerTimestamp()
    mockResponseSuccess()

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    await testAdapter.request({ endpoint: 'stock_quotes', base: 'AAPL' })
    await testAdapter.request({ base: 'AAPL' })
    // waitForCache checks mockCache.cache.size — the number of distinct cache entries.
    // With COMPOSITE_TRANSPORT=true both transports share a single cache key per symbol,
    // so there are exactly 2 entries: stock_quotes/AAPL and stock/AAPL.
    await testAdapter.waitForCache(2)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServerStockQuotes?.close()
    mockWsServerStock?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
  })

  it('stock_quotes: HTTP data wins when it has a newer providerIndicatedTimeUnixMs than WS', async () => {
    const response = await testAdapter.request({ endpoint: 'stock_quotes', base: 'AAPL' })
    expect(response.statusCode).toBe(200)
    const json = response.json()
    // WS sent ask=100, bid=80 (t=1000). HTTP sent ask=200, bid=180 (t=9999999).
    // CompareResponseCache overwrites the WS entry because 9999999 > 1000.
    expect(json.data.ask_price).toBe(200)
    expect(json.data.bid_price).toBe(180)
    expect(json.data.mid_price).toBe(190)
    expect(json.timestamps.providerIndicatedTimeUnixMs).toBe(9999999)
  })

  it('stock: WS data wins when it has a newer providerIndicatedTimeUnixMs than HTTP', async () => {
    const response = await testAdapter.request({ base: 'AAPL' })
    expect(response.statusCode).toBe(200)
    const json = response.json()
    // WS sent price=163.58 (t=1646154954689). HTTP sent ask=26.32, bid=25.8 (t=1628899200621).
    // CompareResponseCache keeps WS because 1646154954689 > 1628899200621.
    expect(json.result).toBe(163.58)
  })
})
