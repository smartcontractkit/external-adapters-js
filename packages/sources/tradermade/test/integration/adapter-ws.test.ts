import {
  TestAdapter,
  setEnvVariables,
  mockWebSocketProvider,
  MockWebsocketServer,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import FakeTimers from '@sinonjs/fake-timers'
import { mockForexWebSocketServer } from './fixtures'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'
  let oldEnv: NodeJS.ProcessEnv
  const data = {
    base: 'USD',
    quote: 'JPY',
    endpoint: 'forex',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_KEY'] = 'fake-api-key'
    process.env['API_KEY'] = 'fake-api-key'
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['WS_ENABLED'] = 'true'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockForexWebSocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with result
    await testAdapter.request(data)
    await testAdapter.waitForCache()
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('forex endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
