import {
  TestAdapter,
  setEnvVariables,
  mockWebSocketProvider,
  MockWebsocketServer,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import {
  mockCryptoWebSocketServer,
  mockEtfWebSocketServer,
  mockForexWebSocketServer,
  mockStockWebSocketServer,
} from './fixtures'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
describe('websocket', () => {
  let mockWsServerStock: MockWebsocketServer | undefined
  let mockWsServerForex: MockWebsocketServer | undefined
  let mockWsServerCrypto: MockWebsocketServer | undefined
  let mockWsServerEtf: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpointStock = 'ws://localhost:9090'
  const wsEndpointForex = 'ws://localhost:9091'
  const wsEndpointCrypto = 'ws://localhost:9092'
  const wsEndpointEtf = 'ws://localhost:9093'
  let oldEnv: NodeJS.ProcessEnv
  const stockData = {
    base: 'AAPL',
    transport: 'ws',
  }
  const forexData = {
    endpoint: 'forex',
    base: 'GBP',
    quote: 'USD',
    transport: 'ws',
  }
  const cryptoData = {
    endpoint: 'crypto',
    base: 'BTC',
    quote: 'USD',
    transport: 'ws',
  }
  const ukEtfData = {
    endpoint: 'uk_etf',
    base: 'CSPX',
    transport: 'ws',
  }
  const etfData = {
    endpoint: 'etf',
    base: 'C3M',
    transport: 'ws',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_ENABLED'] = 'true'
    process.env['WS_SOCKET_KEY'] = 'fake-api-key'
    process.env['STOCK_WS_API_ENDPOINT'] = wsEndpointStock
    process.env['FOREX_WS_API_ENDPOINT'] = wsEndpointForex
    process.env['CRYPTO_WS_API_ENDPOINT'] = wsEndpointCrypto
    process.env['ETF_WS_API_ENDPOINT'] = wsEndpointEtf
    process.env['API_KEY'] = 'fake-api-key'

    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServerStock = mockStockWebSocketServer(wsEndpointStock)
    mockWsServerForex = mockForexWebSocketServer(wsEndpointForex)
    mockWsServerCrypto = mockCryptoWebSocketServer(wsEndpointCrypto)
    mockWsServerEtf = mockEtfWebSocketServer(wsEndpointEtf)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results
    await testAdapter.request(stockData)
    await testAdapter.request(forexData)
    await testAdapter.request(cryptoData)
    await testAdapter.request(ukEtfData)
    await testAdapter.request(etfData)
    await testAdapter.waitForCache(5)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServerStock?.close()
    mockWsServerCrypto?.close()
    mockWsServerForex?.close()
    mockWsServerEtf?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('stock endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(stockData)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('forex endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(forexData)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('crypto endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(cryptoData)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('uk etf endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(ukEtfData)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('etf endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(etfData)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
