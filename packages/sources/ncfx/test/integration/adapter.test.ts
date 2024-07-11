import { mockCryptoWebSocketServer, mockForexWebSocketServer } from './fixtures'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  TestAdapter,
  setEnvVariables,
  mockWebSocketProvider,
  MockWebsocketServer,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let mockWsServerForex: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'
  const wsEndpointForex = 'ws://localhost:9091'
  let oldEnv: NodeJS.ProcessEnv
  const cryptoData = {
    base: 'eth',
    quote: 'usd',
  }
  const cryptoDataLwbaInvariantViolation = {
    base: 'btc',
    quote: 'usd',
  }
  const forexData = {
    base: 'CAD',
    quote: 'USD',
    endpoint: 'forex',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_SUBSCRIPTION_TTL'] = '5000'
    process.env['CACHE_MAX_AGE'] = '5000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    process.env['METRICS_ENABLED'] = 'false'
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['FOREX_WS_API_ENDPOINT'] = wsEndpointForex
    process.env['API_USERNAME'] = 'test-api-username'
    process.env['API_PASSWORD'] = 'test-api-password'
    process.env['FOREX_WS_API_KEY'] = 'test-api-key'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockCryptoWebSocketServer(wsEndpoint)
    mockWsServerForex = mockForexWebSocketServer(wsEndpointForex)

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results
    await testAdapter.request(cryptoData)
    await testAdapter.request(cryptoDataLwbaInvariantViolation)
    await testAdapter.request(forexData)
    await testAdapter.waitForCache(3)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    mockWsServerForex?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('crypto endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(cryptoData)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error (empty data)', async () => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty base)', async () => {
      const response = await testAdapter.request({ quote: 'BTC' })
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty quote)', async () => {
      const response = await testAdapter.request({ base: 'ETH' })
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (LWBA invariant violation)', async () => {
      const response = await testAdapter.request(cryptoDataLwbaInvariantViolation)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('forex endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(forexData)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error (empty data)', async () => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty base)', async () => {
      const response = await testAdapter.request({ quote: 'BTC' })
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty quote)', async () => {
      const response = await testAdapter.request({ base: 'ETH' })
      expect(response.statusCode).toEqual(400)
    })
  })
})
