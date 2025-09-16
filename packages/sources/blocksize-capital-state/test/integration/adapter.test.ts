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

  const baseRequest = {
    base: 'CBBTC',
    quote: 'USD',
    endpoint: 'state',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_KEY'] = 'fake-api-key'

    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebsocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    await testAdapter.request(baseRequest)
    await testAdapter.waitForCache()
  }, 15000)

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('state endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(baseRequest)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return aggregated_state_price and include timestamp', async () => {
      const response = await testAdapter.request(baseRequest)
      const body = response.json()

      expect(body.data.result).toBeDefined()
      expect(typeof body.data.result).toBe('number')
      expect(body.timestamps.providerIndicatedTimeUnixMs).toBeDefined()
    })

    it('should succeed with USD and ETH quotes', async () => {
      for (const q of ['USD', 'ETH']) {
        const response = await testAdapter.request({
          base: 'CBBTC',
          quote: q,
          endpoint: 'state',
        })
        expect(response.statusCode).toBe(200)
      }
    })

    it('should fail with unsupported quote', async () => {
      const response = await testAdapter.request({
        base: 'CBBTC',
        quote: 'EUR', // not allowed per requirement
        endpoint: 'state',
      })
      expect(response.statusCode).not.toBe(200)
    })
  })
})
