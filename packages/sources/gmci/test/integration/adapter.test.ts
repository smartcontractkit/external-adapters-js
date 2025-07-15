import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockWebsocketServer } from './fixtures'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'
  let oldEnv: NodeJS.ProcessEnv

  const dataPrice = {
    index: 'GMCI30',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_KEY'] = 'fake-api-key'
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebsocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results

    await testAdapter.request(dataPrice)
    await testAdapter.waitForCache(1)
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

    it('should receive a price message and update cache', async () => {
      // Send adapter HTTP request
      const response = await testAdapter.request(dataPrice)

      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(json.data.result).toBe(183.7141917913536)
      expect(json.result).toBe(183.7141917913536)
      expect(json.timestamps.providerIndicatedTimeUnixMs).toBe(1752394072746)
    })

    it('should receive a rebalance_status message and update cache', async () => {
      const response = await testAdapter.request(dataPrice)
      const json = response.json()
      expect(json.data.status).toBe('rebalanced')
      expect(json.data.start_time).toBe('2025-07-25T15:30:00Z')
      expect(json.data.end_time).toBe('2025-07-25T16:30:00Z')
    })
  })
})
