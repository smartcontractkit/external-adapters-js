import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { wsTransport } from '../../src/transport/price'
import { mockWebsocketServer } from './fixtures'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'
  let oldEnv: NodeJS.ProcessEnv

  const priceData = {
    base: 'wsteth',
    quote: 'eth',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_KEY'] = 'fake-api-key'

    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebsocketServer(wsEndpoint + '/crypto-synth-state')

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results
    await testAdapter.request(priceData)
    await testAdapter.waitForCache(1)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('crypto state endpoint', () => {
    it('should normalize mixed-case base and quote params', async () => {
      const response = await testAdapter.request({
        base: 'wstETH',
        quote: 'EtH',
      })
      const body = response.json()

      expect(response.statusCode).toBe(200)
      expect(body.result).toBe(1.1807636997924935)
      expect(body.data.result).toBe(1.1807636997924935)
    })

    it('should only subscribe once for mixed-case requests', async () => {
      const lowercaseData = {
        base: 'wsteth',
        quote: 'eth',
      }
      const mixedCaseData = {
        base: 'wstETH',
        quote: 'ETH',
      }

      const response1 = await testAdapter.request(lowercaseData)
      const body1 = response1.json()
      expect(response1.statusCode).toBe(200)
      expect(body1.result).toBe(1.1807636997924935)
      expect(body1.data.result).toBe(1.1807636997924935)

      const response2 = await testAdapter.request(mixedCaseData)
      const body2 = response2.json()
      expect(response2.statusCode).toBe(200)
      expect(body2.result).toBe(1.1807636997924935)
      expect(body2.data.result).toBe(1.1807636997924935)

      expect(await wsTransport.subscriptionSet.getAll()).toHaveLength(1)
    })
  })
})
