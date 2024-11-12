import {
  TestAdapter,
  setEnvVariables,
  mockWebSocketProvider,
  MockWebsocketServer,
  runAllUntilTime,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { mockWebSocketServer } from './fixtures'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'wss://stream.tradingeconomics.com/?client=fake-api-key:fake-api-secret'
  let oldEnv: NodeJS.ProcessEnv
  const dataPrice = {
    base: 'CAD',
    quote: 'USD',
    transport: 'ws',
  }
  const dataStock = {
    base: 'AAPL:US',
    endpoint: 'stock',
    transport: 'ws',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_CLIENT_KEY'] = 'fake-api-key'
    process.env['WS_ENABLED'] = 'true'
    process.env['API_CLIENT_SECRET'] = 'fake-api-secret'

    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebSocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results
    await testAdapter.request(dataPrice)
    await testAdapter.waitForCache()
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('stock endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(dataStock)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('price endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(dataPrice)
      expect(response.json()).toMatchSnapshot()
    })

    it('should update the ttl after heartbeat is received', async () => {
      // The cache ttl is 90 seconds. Mocked heartbeat message is sent after 10s after connection which should
      // update the ttl and therefore after 93 seconds (from the initial message) we can access the asset
      await runAllUntilTime(testAdapter.clock, 93000)
      const response = await testAdapter.request(dataPrice)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
