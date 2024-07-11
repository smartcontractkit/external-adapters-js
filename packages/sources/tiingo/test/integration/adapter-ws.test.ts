import {
  TestAdapter,
  setEnvVariables,
  mockWebSocketProvider,
  MockWebsocketServer,
  runAllUntilTime,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import {
  mockCryptoWebSocketServer,
  mockCryptoLwbaWebSocketServer,
  mockIexWebSocketServer,
  mockForexWebSocketServer,
} from './fixtures'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import FakeTimers from '@sinonjs/fake-timers'

describe('websocket', () => {
  let mockWsServerCrypto: MockWebsocketServer | undefined
  let mockWsServerCryptoLwba: MockWebsocketServer | undefined
  let mockWsServerIex: MockWebsocketServer | undefined
  let mockWsServerForex: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'
  let oldEnv: NodeJS.ProcessEnv

  const priceData = {
    base: 'eth',
    quote: 'usd',
  }
  const spreadData = {
    endpoint: 'crypto_lwba',
    base: 'eth',
    quote: 'usd',
  }
  const priceDataAapl = {
    endpoint: 'iex',
    base: 'aapl',
    transport: 'ws',
  }
  const priceDataAmzn = {
    endpoint: 'iex',
    base: 'amzn',
    transport: 'ws',
  }
  const priceDataForex = {
    endpoint: 'forex',
    base: 'eur',
    quote: 'usd',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_KEY'] = 'fake-api-key'
    process.env['WS_SUBSCRIPTION_UNRESPONSIVE_TTL'] = '180000'
    process.env['CACHE_MAX_AGE'] = '150000'
    process.env['WS_SUBSCRIPTION_TTL'] = '180000'

    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServerCrypto = mockCryptoWebSocketServer(wsEndpoint + '/crypto-synth')
    mockWsServerCryptoLwba = mockCryptoLwbaWebSocketServer(wsEndpoint + '/crypto-synth-top')
    mockWsServerIex = mockIexWebSocketServer(wsEndpoint + '/iex')
    mockWsServerForex = mockForexWebSocketServer(wsEndpoint + '/fx')

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results
    await testAdapter.request(priceData)
    await testAdapter.request(spreadData)
    await testAdapter.request(priceDataAapl)
    await testAdapter.request(priceDataAmzn)
    await testAdapter.request(priceDataForex)
    await testAdapter.waitForCache(5)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServerCrypto?.close()
    mockWsServerCryptoLwba?.close()
    mockWsServerIex?.close()
    mockWsServerForex?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('crypto endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(priceData)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('crypto_lwba endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(spreadData)
      expect(response.json()).toMatchSnapshot()
    })
    it('should return error (invariant violation)', async () => {
      // fast forward to next message (which contains an invariant violation)
      testAdapter.clock.tick(5000)
      const response = await testAdapter.request(spreadData)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('forex endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(priceDataForex)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('iex endpoint', () => {
    it('Q request should return success', async () => {
      const response = await testAdapter.request(priceDataAapl)
      expect(response.json()).toMatchSnapshot()
    })
    it('T request should return success', async () => {
      const response = await testAdapter.request(priceDataAmzn)
      expect(response.json()).toMatchSnapshot()
    })

    it('should update the ttl after heartbeat is received', async () => {
      // The cache ttl is 150 seconds. Mocked heartbeat message is sent after 10s after connection which should
      // update the ttl and therefore after 153 seconds (from the initial message) we can access the asset
      await runAllUntilTime(testAdapter.clock, 153000)
      const response = await testAdapter.request(priceDataAapl)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
