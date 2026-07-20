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

// Sanity test for COMPOSITE_TRANSPORT=true selection between REST & WS via timestamp comparison.
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
