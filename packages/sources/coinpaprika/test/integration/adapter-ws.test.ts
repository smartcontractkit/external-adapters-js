import { mockCryptoWebSocketServer } from './fixtures'
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
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'
  let oldEnv: NodeJS.ProcessEnv

  const cryptoData = {
    base: 'ETH',
    quote: 'USD',
    transport: 'ws',
  }

  const volumeData = {
    base: 'AAA',
    coinid: 'eth-ethereum',
    quote: 'USD',
    transport: 'ws',
    endpoint: 'volume',
  }

  const marketcapData = {
    base: 'AAA',
    coinid: 'eth-ethereum',
    quote: 'USD',
    transport: 'ws',
    endpoint: 'marketcap',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['CACHE_POLLING_MAX_RETRIES'] = process.env['CACHE_POLLING_MAX_RETRIES'] ?? '0'
    process.env['METRICS_ENABLED'] = process.env['METRICS_ENABLED'] ?? 'false'
    process.env['WS_API_ENDPOINT'] = process.env['WS_API_ENDPOINT'] ?? wsEndpoint

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockCryptoWebSocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial requests to start background execute and wait for cache to be filled with results
    await testAdapter.request(cryptoData)
    await testAdapter.request(volumeData)
    await testAdapter.request(marketcapData)
    await testAdapter.waitForCache(3)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('crypto endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(cryptoData)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('volume endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(volumeData)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('marketcap endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(marketcapData)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
