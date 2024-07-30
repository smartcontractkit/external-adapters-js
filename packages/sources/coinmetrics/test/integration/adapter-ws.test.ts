import {
  TestAdapter,
  setEnvVariables,
  mockWebSocketProvider,
  MockWebsocketServer,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { mockWebSocketServer, mockCryptoLwbaWebSocketServer } from './fixtures'
import FakeTimers from '@sinonjs/fake-timers'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let mockWsServerLwba: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  const wsEndpoint = 'ws://localhost:9090/v4/timeseries-stream/asset-metrics'
  const wsEndpointLwba = 'ws://localhost:9090/v4/timeseries-stream/asset-quotes'
  const data = {
    base: 'ETH',
    quote: 'USD',
  }
  const dataLwba = {
    endpoint: 'crypto-lwba',
    base: 'ETH',
    quote: 'USD',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_SUBSCRIPTION_TTL'] = '5000'
    process.env['CACHE_MAX_AGE'] = '5000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_KEY'] = 'fake-api-key'

    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebSocketServer(wsEndpoint)
    mockWsServerLwba = mockCryptoLwbaWebSocketServer(wsEndpointLwba)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results
    await testAdapter.request(data)
    await testAdapter.request(dataLwba)
    await testAdapter.waitForCache(2)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    mockWsServerLwba?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('price endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error (empty data)', async () => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty base)', async () => {
      const response = await testAdapter.request({ quote: 'USD' })
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty quote)', async () => {
      const response = await testAdapter.request({ base: 'ETH' })
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (bad quote)', async () => {
      const response = await testAdapter.request({ base: 'ETH', quote: 'INVALID' })
      expect(response.statusCode).toEqual(400)
    })
  })

  describe('lwba endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(dataLwba)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error (empty body)', async () => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty data)', async () => {
      const response = await testAdapter.request({ endpoint: 'crypto-lwba' })
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty base)', async () => {
      const response = await testAdapter.request({ endpoint: 'crypto-lwba', quote: 'USD' })
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty quote)', async () => {
      const response = await testAdapter.request({ endpoint: 'crypto-lwba', base: 'ETH' })
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (invariant violation)', async () => {
      // fast forward to next message (which contains an invariant violation)
      testAdapter.clock.tick(1000)
      const response = await testAdapter.request(dataLwba)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
