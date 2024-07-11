import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { mockWebSocketServer } from './fixtures'
import {
  TestAdapter,
  setEnvVariables,
  mockWebSocketProvider,
  MockWebsocketServer,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'wss://data.blocksize.capital/marketdata/v1/ws'
  let oldEnv: NodeJS.ProcessEnv
  const data = {
    base: 'ETH',
    quote: 'EUR',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_KEY'] = 'fake-api-key'

    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebSocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results
    await testAdapter.request(data)
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
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
    })
  })
  describe('lwba endpoint', () => {
    it('should return success', async () => {
      const lwbaData = {
        base: 'ETH',
        quote: 'USD',
        endpoint: 'crypto-lwba',
      }
      const response = await testAdapter.request(lwbaData)
      expect(response.json()).toMatchSnapshot()
    })
    it('should return error (LWBA invariant violation)', async () => {
      const lwbaData = {
        base: 'LINK',
        quote: 'USD',
        endpoint: 'crypto-lwba',
      }
      const response = await testAdapter.request(lwbaData)
      expect(response.json()).toMatchSnapshot()
    })
  })
  describe('vwap endpoint', () => {
    it('should return success', async () => {
      const vwapData = {
        base: 'AMPL',
        quote: 'USD',
        endpoint: 'vwap',
      }
      const response = await testAdapter.request(vwapData)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
