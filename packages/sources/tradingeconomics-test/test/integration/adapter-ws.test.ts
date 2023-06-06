import {
  TestAdapter,
  setEnvVariables,
  mockWebSocketProvider,
  MockWebsocketServer,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
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

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
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

  describe('price endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(dataPrice)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('stock endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(dataStock)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
